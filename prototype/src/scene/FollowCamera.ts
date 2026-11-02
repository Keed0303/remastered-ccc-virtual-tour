import * as THREE from 'three';
import { COLLIDERS, cameraCeiling, floorHeight } from '../utils/physics';

const LOOK_SPEED = 0.0032, PITCH_MIN = -0.3, PITCH_MAX = 1.25, ZOOM_MIN = 2.5, ZOOM_MAX = 14;
const CAMERA_GAP = 0.3;

// How far the camera can sit from the player before a wall gets in the way, from 0 to 1.
function clearPath(from: THREE.Vector3, to: THREE.Vector3) {
  let best = 1;
  const dx = to.x - from.x, dz = to.z - from.z, dy = to.y - from.y;
  for (const c of COLLIDERS) {
    if (c.top === 0) continue;
    let t0 = 0, t1 = 1, hit = true;
    const spans = [[from.x, dx, c.x0 - CAMERA_GAP, c.x1 + CAMERA_GAP], [from.z, dz, c.z0 - CAMERA_GAP, c.z1 + CAMERA_GAP]];
    for (const [o, d, a, b] of spans) {
      if (Math.abs(d) < 1e-6) { if (o < a || o > b) hit = false; continue; }
      let n = (a - o) / d, f = (b - o) / d;
      if (n > f) [n, f] = [f, n];
      t0 = Math.max(t0, n); t1 = Math.min(t1, f);
    }
    if (!hit || t0 > t1 || t0 <= 0) continue;
    if (c.top !== undefined && from.y + dy * t0 > c.top) continue;
    best = Math.min(best, t0);
  }
  return best;
}

// The third-person camera: mouse or touch look, zoom, and staying clear of walls.
export class FollowCamera {
  readonly look = { yaw: Math.PI, pitch: 0.32, distance: 6.5, actual: 6.5, drag: null as [number, number, number] | null };
  private mouseFreedAt = -1000;
  private target = new THREE.Vector3();
  private wanted = new THREE.Vector3();
  private camera: THREE.PerspectiveCamera;
  private avatar: THREE.Object3D;
  private canvas: HTMLCanvasElement;

  constructor(camera: THREE.PerspectiveCamera, avatar: THREE.Object3D, canvas: HTMLCanvasElement, isActive: () => boolean, onLockChange: (locked: boolean) => void, signal: AbortSignal) {
    this.camera = camera;
    this.avatar = avatar;
    this.canvas = canvas;
    const { look } = this;
    canvas.addEventListener('pointerdown', (e) => {
      if (!isActive()) return;
      look.drag = [e.clientX, e.clientY, e.pointerId];
      // Capture the mouse like a game. Holding and dragging still works if the browser refuses.
      if (e.pointerType === 'mouse' && !document.pointerLockElement) {
        try { canvas.requestPointerLock()?.catch?.(() => {}); } catch { /* Dragging remains available. */ }
      }
    }, { signal });
    addEventListener('pointermove', (e) => {
      if (!isActive()) return;
      if (document.pointerLockElement === canvas) {
        this.turn(e.movementX, e.movementY);
      } else if (look.drag && e.pointerId === look.drag[2]) {
        this.turn(e.clientX - look.drag[0], e.clientY - look.drag[1]);
        look.drag = [e.clientX, e.clientY, e.pointerId];
      }
    }, { signal });
    for (const type of ['pointerup', 'pointercancel'] as const) {
      addEventListener(type, (e) => { if (look.drag && e.pointerId === look.drag[2]) look.drag = null; }, { signal });
    }
    canvas.addEventListener('wheel', (e) => {
      if (!isActive()) return;
      e.preventDefault();
      look.distance = THREE.MathUtils.clamp(look.distance + e.deltaY * 0.008, ZOOM_MIN, ZOOM_MAX);
    }, { passive: false, signal });
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement) this.mouseFreedAt = performance.now();
      onLockChange(!!document.pointerLockElement);
    }, { signal });
  }

  turn(dx: number, dy: number) {
    const { look } = this;
    look.yaw -= dx * LOOK_SPEED;
    look.pitch = THREE.MathUtils.clamp(look.pitch + dy * LOOK_SPEED, PITCH_MIN, PITCH_MAX);
  }

  reset() {
    Object.assign(this.look, { yaw: Math.PI, pitch: 0.32, distance: 6.5, actual: 6.5 });
  }

  releaseMouse() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  // The first Esc only frees the mouse, as in most games.
  get escapeFreesMouse() {
    return !!document.pointerLockElement || performance.now() - this.mouseFreedAt < 250;
  }

  update(dt: number) {
    const { look, target, wanted, camera, avatar } = this;
    target.set(avatar.position.x, avatar.position.y + 1.65, avatar.position.z);
    const cosP = Math.cos(look.pitch);
    wanted.set(Math.sin(look.yaw) * cosP, Math.sin(look.pitch), Math.cos(look.yaw) * cosP).multiplyScalar(look.distance).add(target);
    // Stay under ceilings and above the floor before checking walls.
    const ceiling = cameraCeiling(wanted.x, wanted.z);
    if (wanted.y > ceiling) wanted.y = ceiling;
    const free = clearPath(target, wanted) * look.distance;
    // Move in at once when a wall blocks the view, and back out gently.
    look.actual = free < look.actual ? free : look.actual + (free - look.actual) * Math.min(1, dt * 5 || 1);
    const k = look.distance > 0 ? look.actual / look.distance : 1;
    camera.position.lerpVectors(target, wanted, k);
    const floorY = floorHeight(camera.position.x, camera.position.z) + 0.3;
    if (camera.position.y < floorY) camera.position.y = floorY;
    camera.lookAt(target);
  }

  dispose() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }
}
