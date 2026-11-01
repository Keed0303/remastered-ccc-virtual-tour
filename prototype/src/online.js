// Other logged-in students: their figures, smooth movement, and name bubbles.
import * as THREE from 'three';
import { DEFAULT_LOOK, WALK_BOUNDS, cleanProfile, floorHeight, indoorBounds } from './data.js';
import { createPlayerFigure, disposeFigure } from './world.js';

const MAX_VISIBLE = 20;
const BUBBLE_RANGE = 70;
const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

function makeBubble(parent, name, self = false) {
  const el = document.createElement('div');
  el.className = `name-bubble${self ? ' self' : ''}`;
  el.textContent = name;
  parent.append(el);
  return el;
}

export function createOnline({ scene, camera, canvas, avatar, bubbleRoot, isWalking }) {
  const players = new Map();
  let selfBubble = null;
  let selfId = null;
  const proj = new THREE.Vector3();

  function spawnPoint(id) {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const x = 24 + (h % 16), z = -117 + ((h >> 8) % 8);
    return [x, floorHeight(x, z), z];
  }

  function addPlayer(user) {
    const fig = createPlayerFigure(user);
    const [x, y, z] = spawnPoint(user.id);
    fig.position.set(x, y, z);
    fig.rotation.y = Math.PI;
    scene.add(fig);
    players.set(user.id, { user, fig, bubble: makeBubble(bubbleRoot, user.name), to: new THREE.Vector3(x, y, z), rot: Math.PI, phase: 0 });
  }

  function removePlayer(id) {
    const p = players.get(id);
    if (!p) return;
    scene.remove(p.fig);
    disposeFigure(p.fig);
    p.bubble.remove();
    players.delete(id);
  }

  function lookChanged(a, b) {
    return a.gender !== b.gender || a.skin !== b.skin || a.hair !== b.hair;
  }

  return {
    setSelf(profile) {
      selfId = profile?.id ?? null;
      selfBubble?.remove();
      selfBubble = profile ? makeBubble(bubbleRoot, profile.name, true) : null;
    },
    // The server's list of who is online. Everything in it is treated as untrusted.
    setUsers(list) {
      const incoming = new Map();
      for (const raw of list) {
        const user = cleanProfile(raw);
        if (user && user.id !== selfId) incoming.set(user.id, user);
      }
      for (const id of [...players.keys()]) if (!incoming.has(id)) removePlayer(id);
      for (const [id, user] of incoming) {
        const existing = players.get(id);
        if (!existing) {
          addPlayer(user);
        } else if (lookChanged(existing.user, user) || existing.user.name !== user.name) {
          const { to, rot, phase } = existing;
          const pos = existing.fig.position.clone();
          removePlayer(id);
          addPlayer(user);
          const next = players.get(id);
          next.fig.position.copy(pos);
          next.to.copy(to);
          next.rot = rot;
          next.phase = phase;
        }
      }
      return players.size + (selfId ? 1 : 0);
    },
    applyMove(move) {
      const p = move && players.get(move.id);
      if (!p) return;
      const b = WALK_BOUNDS;
      p.to.set(
        THREE.MathUtils.clamp(num(move.x, p.to.x), b.x0, b.x1),
        THREE.MathUtils.clamp(num(move.y, p.to.y), 0, 8),
        THREE.MathUtils.clamp(num(move.z, p.to.z), b.z0, b.z1),
      );
      p.rot = num(move.r, p.rot);
    },
    clear() {
      for (const id of [...players.keys()]) removePlayer(id);
      selfBubble?.remove();
      selfBubble = null;
      selfId = null;
    },
    update(dt) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const walking = isWalking();
      const viewerIndoors = walking && indoorBounds(avatar.position.x, avatar.position.z);
      const k = 1 - Math.exp(-dt * 10);

      const place = (el, x, y, z, show) => {
        if (!show) { el.style.display = 'none'; return; }
        proj.set(x, y, z).project(camera);
        if (proj.z > 1) { el.style.display = 'none'; return; }
        el.style.display = 'block';
        el.style.transform = `translate(-50%,-100%) translate(${(proj.x * 0.5 + 0.5) * w}px,${(-proj.y * 0.5 + 0.5) * h}px)`;
      };

      const list = [...players.values()];
      for (const p of list) p.range = p.to.distanceTo(camera.position);
      list.sort((a, b) => a.range - b.range);

      list.forEach((p, i) => {
        const fig = p.fig;
        const before = fig.position.clone();
        fig.position.lerp(p.to, k);
        const turn = Math.atan2(Math.sin(p.rot - fig.rotation.y), Math.cos(p.rot - fig.rotation.y));
        fig.rotation.y += turn * k;
        const speed = dt > 0 ? before.distanceTo(fig.position) / dt : 0;
        const moving = speed > 0.3;
        if (moving) p.phase += dt * 11;
        const swing = moving ? Math.sin(p.phase) * 0.5 : 0;
        fig.userData.legL.rotation.x = swing;
        fig.userData.legR.rotation.x = -swing;
        fig.userData.armL.rotation.x = -swing;
        fig.userData.armR.rotation.x = swing;
        const near = i < MAX_VISIBLE;
        fig.visible = near;
        const indoors = indoorBounds(fig.position.x, fig.position.z);
        const sameSide = Boolean(indoors) === Boolean(viewerIndoors);
        place(p.bubble, fig.position.x, fig.position.y + 2.2, fig.position.z, near && sameSide && p.range < BUBBLE_RANGE);
      });

      if (selfBubble) place(selfBubble, avatar.position.x, avatar.position.y + 2.2, avatar.position.z, walking);
    },
    get count() { return players.size; },
    players,
  };
}

export { DEFAULT_LOOK };
