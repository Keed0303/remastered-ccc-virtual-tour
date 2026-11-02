// Voice between nearby students: the mic, one direct connection per student, and playback.
// The rules are in utils/voice.ts. Voice travels browser to browser, never through Supabase.
import type { CampusConnection } from '../types/backend';
import type { LinkStatus, MicState, SharedMic, VoiceBadge, VoiceSignal, VoiceState } from '../types/voice';
import { MAX_VOICE_PEERS, SPEAK_HOLD, SPEAK_LEVEL, VOICE_STATE_EVERY, VOICE_STATE_TTL, chooseVoicePeers, cleanVoiceMessage, isInitiator, micLevel, voiceBadge, voiceVolume } from '../utils/voice';

const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
const GATHER_MS = 2500;
const CONNECT_TIMEOUT = 20;
const RETRY_AFTER_FAILURE = 20;
const RETRY_AFTER_BYE = 6;
const SPEAKING_SEND_GAP = 0.25;

const now = () => performance.now() / 1000;

export interface VoiceEvents {
  isPlayer: (id: string) => boolean;
  onMicChange?: (state: MicState) => void;
  onMicError?: (message: string) => void;
}
export interface VoicePeerPlace { id: string; distance: number; sameSide: boolean }

interface Peer { mic: SharedMic; speaking: boolean; onFoot: boolean; seen: number }
interface Link {
  pc: RTCPeerConnection;
  initiator: boolean;
  status: LinkStatus;
  startedAt: number;
  volume: number;
  element: HTMLAudioElement | null;
  source: MediaStreamAudioSourceNode | null;
  gain: GainNode | null;
}

// All ICE candidates go inside the offer and answer, which keeps channel traffic low.
function iceGathered(pc: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    const timer = setTimeout(resolve, GATHER_MS);
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') { clearTimeout(timer); resolve(); }
    });
  });
}

function micErrorMessage(err: unknown) {
  const name = (err as Error)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone access is blocked. Allow it in your browser to talk.';
  if (name === 'NotFoundError') return 'No microphone was found.';
  return 'The microphone could not be opened.';
}

export class VoiceChat {
  readonly links = new Map<string, Link>();
  private peers = new Map<string, Peer>();
  private retryAt = new Map<string, number>();
  private failed = new Set<string>();
  private connection: CampusConnection | null = null;
  private selfId: string | null = null;
  private onFoot = false;
  private _mic: MicState = 'off';
  private micRequest = 0;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private samples: Uint8Array<ArrayBuffer> | null = null;
  private lastLoud = -10;
  private speaking = false;
  private lastSent = -10;
  private ctx: AudioContext | null = null;
  private listeners = new AbortController();
  private disposed = false;
  private events: VoiceEvents;

  constructor(events: VoiceEvents) {
    this.events = events;
    // Browsers only start audio after a click or key press.
    const unlock = () => { if (this.ctx?.state === 'suspended') void this.ctx.resume(); };
    const { signal } = this.listeners;
    addEventListener('pointerdown', unlock, { signal });
    addEventListener('keydown', unlock, { signal });
  }

  get mic() { return this._mic; }
  get selfSpeaking() { return this.speaking; }
  get selfBadge(): VoiceBadge | null { return this._mic === 'live' ? 'live' : this._mic === 'muted' ? 'muted' : null; }

  badgeFor(id: string) {
    return voiceBadge(this.peers.get(id)?.mic, this.linkStatus(id));
  }

  isSpeaking(id: string) {
    const peer = this.peers.get(id);
    return !!peer && peer.mic === 'live' && peer.speaking;
  }

  linkStatus(id: string): LinkStatus {
    if (this.failed.has(id)) return 'failed';
    return this.links.get(id)?.status ?? 'none';
  }

  setSelf(id: string | null) {
    this.selfId = id;
  }

  setConnection(connection: CampusConnection | null) {
    if (!connection) this.reset();
    this.connection = connection;
    this.lastSent = -10;
  }

  // Walking only. Leaving walking or opening a 360° photo turns the mic off.
  setOnFoot(onFoot: boolean) {
    if (onFoot === this.onFoot) return;
    this.onFoot = onFoot;
    if (onFoot) {
      this.audio();
    } else {
      this.stopMic();
      this.closeAllLinks();
    }
    this.sendState();
  }

  async toggleMic() {
    if (this._mic === 'live' || this._mic === 'muted') {
      this.setMicEnabled(this._mic === 'muted');
      return;
    }
    if (this._mic === 'asking' || !this.onFoot || !this.connection) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.events.onMicError?.('Voice needs a secure (https) connection and a browser that supports it.');
      return;
    }
    const request = ++this.micRequest;
    this.setMic('asking');
    void this.audio().resume();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      // The student may have stopped walking while the browser was asking.
      if (request !== this.micRequest || this.disposed || !this.onFoot) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }
      this.useMic(stream);
    } catch (err) {
      if (request !== this.micRequest || this.disposed) return;
      this.setMic('off');
      this.events.onMicError?.(micErrorMessage(err));
    }
  }

  receive(raw: unknown) {
    const message = cleanVoiceMessage(raw);
    if (!message || !this.selfId) return;
    if (message.kind === 'state') {
      if (message.id !== this.selfId && this.events.isPlayer(message.id)) this.onState(message);
      return;
    }
    if (message.to !== this.selfId || !this.events.isPlayer(message.from)) return;
    if (message.kind === 'offer') void this.onOffer(message);
    else if (message.kind === 'answer') void this.onAnswer(message);
    else this.onBye(message.from);
  }

  peerLeft(id: string) {
    this.closeLink(id);
    this.peers.delete(id);
    this.retryAt.delete(id);
    this.failed.delete(id);
  }

  // Once a frame, with where the other students are.
  update(places: VoicePeerPlace[]) {
    const time = now();
    this.measureMic(time);
    this.expirePeers(time);
    if (this.connection && this.onFoot && time - this.lastSent > VOICE_STATE_EVERY) this.sendState();
    if (!this.onFoot) return;

    for (const place of places) {
      const link = this.links.get(place.id);
      if (link) this.setVolume(link, voiceVolume(place.distance, place.sameSide));
    }
    this.manageLinks(places, time);
  }

  dispose() {
    this.disposed = true;
    this.listeners.abort();
    this.reset();
    this.connection = null;
    void this.ctx?.close();
    this.ctx = null;
  }

  private reset() {
    this.stopMic();
    this.closeAllLinks();
    this.peers.clear();
    this.retryAt.clear();
    this.failed.clear();
  }

  private audio() {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private setMic(state: MicState) {
    if (state === this._mic) return;
    this._mic = state;
    this.events.onMicChange?.(state);
  }

  private useMic(stream: MediaStream) {
    this.micStream = stream;
    const ctx = this.audio();
    this.micSource = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.samples = new Uint8Array(this.analyser.fftSize);
    this.micSource.connect(this.analyser);
    this.setMic('live');
    for (const link of this.links.values()) this.attachMic(link.pc);
    this.sendState();
  }

  private setMicEnabled(on: boolean) {
    for (const track of this.micStream?.getTracks() ?? []) track.enabled = on;
    this.speaking = false;
    this.setMic(on ? 'live' : 'muted');
    this.sendState();
  }

  private stopMic() {
    this.micRequest++;
    for (const track of this.micStream?.getTracks() ?? []) track.stop();
    this.micSource?.disconnect();
    this.micStream = null;
    this.micSource = null;
    this.analyser = null;
    this.samples = null;
    this.speaking = false;
    for (const link of this.links.values()) this.attachMic(link.pc);
    this.setMic('off');
  }

  private attachMic(pc: RTCPeerConnection) {
    const sender = pc.getTransceivers()[0]?.sender;
    const track = this.micStream?.getAudioTracks()[0] ?? null;
    if (sender && pc.signalingState !== 'closed') void sender.replaceTrack(track).catch(() => {});
  }

  private measureMic(time: number) {
    if (!this.analyser || !this.samples || this._mic !== 'live') return;
    this.analyser.getByteTimeDomainData(this.samples);
    if (micLevel(this.samples) > SPEAK_LEVEL) this.lastLoud = time;
    const speaking = time - this.lastLoud < SPEAK_HOLD;
    if (speaking !== this.speaking && time - this.lastSent > SPEAKING_SEND_GAP) {
      this.speaking = speaking;
      this.sendState();
    }
  }

  private sharedMic(): SharedMic {
    return this._mic === 'live' || this._mic === 'muted' ? this._mic : 'off';
  }

  private sendState() {
    if (!this.connection || !this.selfId) return;
    this.lastSent = now();
    void this.connection.sendVoice({ kind: 'state', id: this.selfId, mic: this.sharedMic(), speaking: this.speaking, onFoot: this.onFoot });
  }

  private sendSignal(kind: VoiceSignal['kind'], to: string, sdp?: string) {
    if (!this.connection || !this.selfId) return;
    void this.connection.sendVoice({ kind, from: this.selfId, to, ...(sdp ? { sdp } : {}) });
  }

  private onState({ id, mic, speaking, onFoot }: VoiceState) {
    this.peers.set(id, { mic, speaking, onFoot, seen: now() });
    if (!onFoot) this.closeLink(id);
  }

  private expirePeers(time: number) {
    for (const [id, peer] of this.peers) {
      if (time - peer.seen > VOICE_STATE_TTL) this.peerLeft(id);
    }
  }

  // Connect when the pair is close and at least one has a mic on. The lower id decides.
  private manageLinks(places: VoicePeerPlace[], time: number) {
    const { selfId } = this;
    if (!selfId || !this.connection) return;
    const myMicOn = this.sharedMic() !== 'off';
    const wanted = places.filter((place) => {
      const peer = this.peers.get(place.id);
      return !!peer && peer.onFoot && (myMicOn || peer.mic !== 'off');
    });
    const keep = chooseVoicePeers(wanted.map((p) => ({ id: p.id, distance: p.distance, connected: this.links.has(p.id) })));

    for (const [id, link] of this.links) {
      if (link.status !== 'connected' && time - link.startedAt > CONNECT_TIMEOUT) {
        this.markFailed(id);
      } else if (link.initiator && !keep.has(id)) {
        this.sendSignal('bye', id);
        this.closeLink(id);
      }
    }
    for (const id of keep) {
      if (!isInitiator(selfId, id) || this.links.has(id)) continue;
      if (time < (this.retryAt.get(id) ?? 0)) continue;
      void this.offerTo(id);
    }
    // Out of reach, so a past failure no longer means anything.
    for (const id of this.failed) if (!keep.has(id)) this.failed.delete(id);
  }

  private openLink(id: string, initiator: boolean) {
    this.closeLink(id);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const link: Link = { pc, initiator, status: 'connecting', startedAt: now(), volume: 0, element: null, source: null, gain: null };
    this.links.set(id, link);
    pc.ontrack = (e) => this.playTrack(link, e.track);
    pc.onconnectionstatechange = () => {
      if (this.links.get(id) !== link) return;
      if (pc.connectionState === 'connected') {
        link.status = 'connected';
        // A failure stays on show during retries, so the icon doesn't flicker.
        this.failed.delete(id);
      } else if (pc.connectionState === 'failed') this.markFailed(id);
    };
    return link;
  }

  private async offerTo(id: string) {
    const link = this.openLink(id, true);
    const { pc } = link;
    try {
      // The slot is reserved now, so turning the mic on later needs no renegotiation.
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      this.attachMic(pc);
      await pc.setLocalDescription(await pc.createOffer());
      await iceGathered(pc);
      if (this.links.get(id) === link) this.sendSignal('offer', id, pc.localDescription?.sdp);
    } catch {
      if (this.links.get(id) === link) this.markFailed(id);
    }
  }

  private async onOffer({ from, sdp }: VoiceSignal) {
    if (!this.selfId || isInitiator(this.selfId, from)) return;
    const others = [...this.links.keys()].filter((id) => id !== from).length;
    if (!this.onFoot || others >= MAX_VOICE_PEERS) {
      this.sendSignal('bye', from);
      return;
    }
    const link = this.openLink(from, false);
    const { pc } = link;
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp });
      const transceiver = pc.getTransceivers()[0];
      if (transceiver) transceiver.direction = 'sendrecv';
      this.attachMic(pc);
      await pc.setLocalDescription(await pc.createAnswer());
      await iceGathered(pc);
      if (this.links.get(from) === link) this.sendSignal('answer', from, pc.localDescription?.sdp);
    } catch {
      if (this.links.get(from) === link) this.markFailed(from);
    }
  }

  private async onAnswer({ from, sdp }: VoiceSignal) {
    const link = this.links.get(from);
    if (!link?.initiator || link.pc.signalingState !== 'have-local-offer') return;
    try {
      await link.pc.setRemoteDescription({ type: 'answer', sdp });
    } catch {
      if (this.links.get(from) === link) this.markFailed(from);
    }
  }

  private onBye(from: string) {
    this.closeLink(from);
    this.retryAt.set(from, now() + RETRY_AFTER_BYE);
  }

  private markFailed(id: string) {
    this.closeLink(id);
    this.failed.add(id);
    this.retryAt.set(id, now() + RETRY_AFTER_FAILURE);
  }

  // Chrome plays remote WebRTC audio through Web Audio only while an element holds the stream.
  private playTrack(link: Link, track: MediaStreamTrack) {
    if (this.links.size === 0 || this.disposed) return;
    const stream = new MediaStream([track]);
    const element = new Audio();
    element.muted = true;
    element.srcObject = stream;
    void element.play().catch(() => {});
    const ctx = this.audio();
    const source = ctx.createMediaStreamSource(stream);
    const gain = ctx.createGain();
    gain.gain.value = link.volume;
    source.connect(gain).connect(ctx.destination);
    link.element = element;
    link.source = source;
    link.gain = gain;
  }

  private setVolume(link: Link, volume: number) {
    if (Math.abs(volume - link.volume) < 0.01) return;
    link.volume = volume;
    if (link.gain && this.ctx) link.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.08);
  }

  private closeLink(id: string) {
    const link = this.links.get(id);
    if (!link) return;
    this.links.delete(id);
    link.pc.ontrack = null;
    link.pc.onconnectionstatechange = null;
    link.pc.close();
    link.source?.disconnect();
    link.gain?.disconnect();
    if (link.element) {
      link.element.pause();
      link.element.srcObject = null;
    }
  }

  private closeAllLinks() {
    for (const id of [...this.links.keys()]) {
      if (this.links.get(id)?.initiator) this.sendSignal('bye', id);
      this.closeLink(id);
    }
  }
}
