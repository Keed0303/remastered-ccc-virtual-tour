// Other logged-in students: their figures, smooth movement, name bubbles, and voice icons.
import * as THREE from 'three';
import type { CampusConnection, Move } from '../types/backend';
import type { PublicProfile } from '../types/character';
import type { VoiceBadge } from '../types/voice';
import { WALK_BOUNDS, floorHeight, indoorBounds } from '../utils/physics';
import { SEATS, cleanSeat } from '../utils/seats';
import { cleanProfile } from '../utils/validation';
import { createPlayerFigure, disposeFigure, sitLimbs, swingLimbs } from './characters/figure';
import { VoiceChat, type VoiceEvents, type VoicePeerPlace } from './VoiceChat';

const MAX_VISIBLE = 20;
const BUBBLE_RANGE = 70;
const SIT_BLEND_TIME = 0.4;
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

function makeBubble(parent: HTMLElement, name: string, self = false) {
  const el = document.createElement('div');
  el.className = `name-bubble${self ? ' self' : ''}`;
  el.textContent = name;
  parent.append(el);
  return el;
}

// The icon above the name is drawn in CSS from these. They change rarely, so writes are skipped.
function setVoiceIcon(el: HTMLElement, badge: VoiceBadge | null, speaking: boolean) {
  const voice = badge ?? '';
  if ((el.dataset.voice ?? '') !== voice) {
    if (badge) el.dataset.voice = badge;
    else delete el.dataset.voice;
  }
  el.classList.toggle('speaking', speaking);
}

function spawnPoint(id: string): [number, number, number] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const x = 24 + (h % 16), z = -117 + ((h >> 8) % 8);
  return [x, floorHeight(x, z), z];
}

const lookChanged = (a: PublicProfile, b: PublicProfile) => a.gender !== b.gender || a.skin !== b.skin || a.hair !== b.hair;

interface Player { user: PublicProfile; fig: THREE.Group; bubble: HTMLElement; to: THREE.Vector3; rot: number; phase: number; range: number; seat: number | null; sitBlend: number }

export class OnlinePlayers {
  readonly players = new Map<string, Player>();
  readonly voice: VoiceChat;
  private selfBubble: HTMLElement | null = null;
  private selfId: string | null = null;
  private proj = new THREE.Vector3();
  private connection: CampusConnection | null = null;
  private lastSent = { at: -10, key: '' };
  private positionKnown = false;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private canvas: HTMLCanvasElement;
  private avatar: THREE.Object3D;
  private bubbleRoot: HTMLElement;
  private isWalking: () => boolean;
  private getSeat: () => number | null;

  constructor(scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement, avatar: THREE.Object3D, bubbleRoot: HTMLElement, isWalking: () => boolean, getSeat: () => number | null, voiceEvents: Omit<VoiceEvents, 'isPlayer'>) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this.avatar = avatar;
    this.bubbleRoot = bubbleRoot;
    this.isWalking = isWalking;
    this.getSeat = getSeat;
    this.voice = new VoiceChat({ ...voiceEvents, isPlayer: (id) => this.players.has(id) });
  }

  private addPlayer(user: PublicProfile) {
    const fig = createPlayerFigure(user);
    const [x, y, z] = spawnPoint(user.id);
    fig.position.set(x, y, z);
    fig.rotation.y = Math.PI;
    this.scene.add(fig);
    this.players.set(user.id, { user, fig, bubble: makeBubble(this.bubbleRoot, user.name), to: new THREE.Vector3(x, y, z), rot: Math.PI, phase: 0, range: 0, seat: null, sitBlend: 0 });
  }

  private removePlayer(id: string) {
    const p = this.players.get(id);
    if (!p) return;
    this.scene.remove(p.fig);
    disposeFigure(p.fig);
    p.bubble.remove();
    this.players.delete(id);
  }

  setSelf(profile: PublicProfile | null) {
    this.selfId = profile?.id ?? null;
    this.voice.setSelf(this.selfId);
    this.selfBubble?.remove();
    this.selfBubble = profile ? makeBubble(this.bubbleRoot, profile.name, true) : null;
  }

  setConnection(connection: CampusConnection | null) {
    this.connection = connection;
    this.voice.setConnection(connection);
    this.lastSent = { at: -10, key: '' };
    this.positionKnown = false;
  }

  // The server's list of who is online. Everything in it is treated as untrusted.
  setUsers(list: unknown[]) {
    const incoming = new Map<string, PublicProfile>();
    for (const raw of list) {
      const user = cleanProfile(raw);
      if (user && user.id !== this.selfId) incoming.set(user.id, user);
    }
    for (const id of [...this.players.keys()]) {
      if (!incoming.has(id)) {
        this.removePlayer(id);
        this.voice.peerLeft(id);
      }
    }
    for (const [id, user] of incoming) {
      const existing = this.players.get(id);
      if (!existing) {
        this.addPlayer(user);
      } else if (lookChanged(existing.user, user) || existing.user.name !== user.name) {
        const { to, rot, phase, seat, sitBlend } = existing;
        const pos = existing.fig.position.clone();
        this.removePlayer(id);
        this.addPlayer(user);
        const next = this.players.get(id)!;
        next.fig.position.copy(pos);
        next.to.copy(to);
        next.rot = rot;
        next.phase = phase;
        next.seat = seat;
        next.sitBlend = sitBlend;
      }
    }
    return this.players.size + (this.selfId ? 1 : 0);
  }

  applyMove(raw: unknown) {
    const move = raw as Partial<Record<keyof Move, unknown>> | null | undefined;
    const p = move && typeof move.id === 'string' ? this.players.get(move.id) : undefined;
    if (!move || !p) return;
    // A sitting student is placed from this browser's own list of seats.
    p.seat = cleanSeat(move.s);
    if (p.seat !== null) {
      const seat = SEATS[p.seat];
      p.to.set(seat.x, seat.y, seat.z);
      p.rot = seat.rotation;
      return;
    }
    const b = WALK_BOUNDS;
    p.to.set(
      THREE.MathUtils.clamp(num(move.x, p.to.x), b.x0, b.x1),
      THREE.MathUtils.clamp(num(move.y, p.to.y), 0, 8),
      THREE.MathUtils.clamp(num(move.z, p.to.z), b.z0, b.z1),
    );
    p.rot = num(move.r, p.rot);
  }

  takenSeats() {
    const taken = new Set<number>();
    for (const p of this.players.values()) if (p.seat !== null) taken.add(p.seat);
    return taken;
  }

  clear() {
    for (const id of [...this.players.keys()]) this.removePlayer(id);
    this.selfBubble?.remove();
    this.selfBubble = null;
    this.selfId = null;
    this.setConnection(null);
    this.voice.setSelf(null);
  }

  private place(el: HTMLElement, x: number, y: number, z: number, show: boolean, w: number, h: number) {
    if (!show) { el.style.display = 'none'; return; }
    const { proj } = this;
    proj.set(x, y, z).project(this.camera);
    if (proj.z > 1) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.transform = `translate(-50%,-100%) translate(${(proj.x * 0.5 + 0.5) * w}px,${(-proj.y * 0.5 + 0.5) * h}px)`;
  }

  // Up to ten updates a second while moving, plus a slow update so late joiners catch up.
  private sendPosition(time: number) {
    const { connection, selfId, lastSent } = this;
    if (!connection || !selfId) return;
    const p = this.avatar.position;
    const seat = this.getSeat();
    const key = this.isWalking() ? `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)},${this.avatar.rotation.y.toFixed(2)},${seat}` : lastSent.key;
    const changed = key !== lastSent.key;
    if ((changed && time - lastSent.at > 0.1) || (this.positionKnown && time - lastSent.at > 2)) {
      connection.sendMove({ id: selfId, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), r: +this.avatar.rotation.y.toFixed(2), ...(seat === null ? {} : { s: seat }) });
      this.lastSent = { at: time, key };
      this.positionKnown = true;
    }
  }

  update(dt: number, time: number) {
    const { canvas, avatar, camera } = this;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const walking = this.isWalking();
    const viewerIndoors = walking && indoorBounds(avatar.position.x, avatar.position.z);
    const k = 1 - Math.exp(-dt * 10);

    const list = [...this.players.values()];
    for (const p of list) p.range = p.to.distanceTo(camera.position);
    list.sort((a, b) => a.range - b.range);

    const places: VoicePeerPlace[] = [];
    list.forEach((p, i) => {
      const fig = p.fig;
      const before = fig.position.clone();
      fig.position.lerp(p.to, k);
      const turn = Math.atan2(Math.sin(p.rot - fig.rotation.y), Math.cos(p.rot - fig.rotation.y));
      fig.rotation.y += turn * k;
      const speed = dt > 0 ? before.distanceTo(fig.position) / dt : 0;
      const moving = speed > 0.3;
      if (moving) p.phase += dt * 11;
      // Eases in and out of the pose, the same as the student sees on their own screen.
      const sitTarget = p.seat === null ? 0 : 1;
      p.sitBlend = sitTarget > p.sitBlend ? Math.min(1, p.sitBlend + dt / SIT_BLEND_TIME) : Math.max(0, p.sitBlend - dt / SIT_BLEND_TIME);
      if (p.sitBlend > 0) {
        p.phase += dt * 1.6;
        sitLimbs(fig, p.sitBlend, p.sitBlend === 1 ? Math.sin(p.phase) * 0.06 : 0);
      } else {
        swingLimbs(fig, moving ? Math.sin(p.phase) * 0.5 : 0);
      }
      const near = i < MAX_VISIBLE;
      fig.visible = near;
      const sameSide = indoorBounds(fig.position.x, fig.position.z) === viewerIndoors;
      this.place(p.bubble, fig.position.x, fig.position.y + 2.2, fig.position.z, near && sameSide && p.range < BUBBLE_RANGE, w, h);
      places.push({ id: p.user.id, distance: fig.position.distanceTo(avatar.position), sameSide });
      setVoiceIcon(p.bubble, this.voice.badgeFor(p.user.id), this.voice.isSpeaking(p.user.id));
    });
    this.voice.update(places);

    if (this.selfBubble) {
      this.place(this.selfBubble, avatar.position.x, avatar.position.y + 2.2, avatar.position.z, walking, w, h);
      setVoiceIcon(this.selfBubble, this.voice.selfBadge, this.voice.selfSpeaking);
    }
    this.sendPosition(time);
  }

  dispose() {
    this.clear();
    this.voice.dispose();
  }
}
