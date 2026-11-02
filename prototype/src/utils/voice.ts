// The pure rules of voice talk. WebRTC and audio live in scene/VoiceChat.ts.
import type { LinkStatus, SharedMic, VoiceBadge, VoiceCandidate, VoiceMessage } from '../types/voice';

export const VOICE_RANGE = 25;
// Open within the range and close beyond this, so someone at the edge doesn't keep reconnecting.
export const VOICE_KEEP_RANGE = 32;
export const MAX_VOICE_PEERS = 6;
export const VOICE_STATE_EVERY = 3;
export const VOICE_STATE_TTL = 9;
export const SPEAK_LEVEL = 0.03;
export const SPEAK_HOLD = 0.4;

const FULL_VOLUME_WITHIN = 4;
const MAX_ID = 64;
const MAX_SDP = 20000;

export function voiceVolume(distance: number, sameSide: boolean) {
  if (!sameSide || !Number.isFinite(distance) || distance >= VOICE_RANGE) return 0;
  if (distance <= FULL_VOLUME_WITHIN) return 1;
  const left = (VOICE_RANGE - distance) / (VOICE_RANGE - FULL_VOLUME_WITHIN);
  return left * left;
}

// Only one side offers, so two students never offer to each other at once.
export const isInitiator = (selfId: string, peerId: string) => selfId < peerId;

export function chooseVoicePeers(candidates: VoiceCandidate[]) {
  const inReach = candidates.filter((c) => c.distance < (c.connected ? VOICE_KEEP_RANGE : VOICE_RANGE));
  inReach.sort((a, b) => a.distance - b.distance);
  return new Set(inReach.slice(0, MAX_VOICE_PEERS).map((c) => c.id));
}

export function voiceBadge(mic: SharedMic | undefined, link: LinkStatus): VoiceBadge | null {
  if (!mic || mic === 'off') return null;
  if (mic === 'muted') return 'muted';
  if (link === 'connected') return 'live';
  return link === 'failed' ? 'failed' : 'wait';
}

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID;
const isSdp = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_SDP;

// Everything from other clients is untrusted. Only known fields survive.
export function cleanVoiceMessage(raw: unknown): VoiceMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, unknown>;
  if (m.kind === 'state') {
    if (!isId(m.id) || (m.mic !== 'off' && m.mic !== 'live' && m.mic !== 'muted')) return null;
    return { kind: 'state', id: m.id, mic: m.mic, speaking: m.speaking === true, onFoot: m.onFoot === true };
  }
  if (m.kind !== 'offer' && m.kind !== 'answer' && m.kind !== 'bye') return null;
  if (!isId(m.from) || !isId(m.to)) return null;
  if (m.kind === 'bye') return { kind: 'bye', from: m.from, to: m.to };
  return isSdp(m.sdp) ? { kind: m.kind, from: m.from, to: m.to, sdp: m.sdp } : null;
}

// Loudness from an analyser's time-domain bytes, where 128 is silence.
export function micLevel(samples: Uint8Array) {
  let sum = 0;
  for (const s of samples) sum += ((s - 128) / 128) ** 2;
  return samples.length ? Math.sqrt(sum / samples.length) : 0;
}
