import * as THREE from 'three';
import type { LocationDef } from '../types/campus';
import { LOCATIONS } from '../utils/campusData';
import { COLLIDERS, WALK_BOUNDS, floorHeight } from '../utils/physics';
import { swingLimbs } from './characters/figure';

const GRAVITY = 19, JUMP_SPEED = 5.8, STEP_LIMIT = 0.5;
const R = 0.5;
const blocked = (x: number, z: number) => COLLIDERS.some((c) => x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R);

// The player on foot. Input arrives through `keys` and `stick`, and everything runs per frame.
export class WalkController {
  readonly keys = new Set<string>();
  readonly stick = { x: 0, y: 0, id: null as number | null };
  nearby: LocationDef | null = null;
  private walkPhase = 0;
  private fallSpeed = 0;
  private fwd = new THREE.Vector3();
  private avatar: THREE.Object3D;
  private getYaw: () => number;
  private onNearby: (location: LocationDef | null) => void;

  constructor(avatar: THREE.Object3D, getYaw: () => number, onNearby: (location: LocationDef | null) => void) {
    this.avatar = avatar;
    this.getYaw = getYaw;
    this.onNearby = onNearby;
  }

  spawn() {
    this.avatar.position.set(29, floorHeight(29, -116), -116);
    this.avatar.rotation.y = Math.PI;
    this.fallSpeed = 0;
  }

  stop() {
    this.keys.clear();
    this.setNearby(null);
  }

  private setNearby(next: LocationDef | null) {
    if (next === this.nearby) return;
    this.nearby = next;
    this.onNearby(next);
  }

  update(dt: number) {
    const { keys, stick, avatar, fwd } = this;
    let ax = 0, az = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) az += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) az -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ax -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ax += 1;
    ax += stick.x;
    az += stick.y;
    const moving = ax || az;
    if (moving) {
      const yaw = this.getYaw();
      fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
      const rx = -fwd.z, rz = fwd.x;
      let dx = fwd.x * az + rx * ax, dz = fwd.z * az + rz * ax;
      const len = Math.hypot(dx, dz);
      dx /= len; dz /= len;
      // The joystick walks at a speed set by how far it is pushed, and runs near its edge.
      const pushed = Math.min(1, Math.hypot(ax, az));
      const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(stick.x, stick.y) > 0.92;
      const speed = (running ? 11 : 5.6) * pushed * dt;
      const b = WALK_BOUNDS;
      const nx = THREE.MathUtils.clamp(avatar.position.x + dx * speed, b.x0, b.x1);
      const nz = THREE.MathUtils.clamp(avatar.position.z + dz * speed, b.z0, b.z1);
      // A move is allowed when nothing solid is in the way and the surface ahead is low enough to step onto.
      const canStand = (x: number, z: number) => !blocked(x, z) && floorHeight(x, z) - avatar.position.y <= STEP_LIMIT;
      if (canStand(nx, avatar.position.z)) avatar.position.x = nx;
      if (canStand(avatar.position.x, nz)) avatar.position.z = nz;
      // Turn smoothly toward the direction of travel.
      const heading = Math.atan2(dx, dz);
      const turn = Math.atan2(Math.sin(heading - avatar.rotation.y), Math.cos(heading - avatar.rotation.y));
      avatar.rotation.y += turn * Math.min(1, dt * 12);
      this.walkPhase += dt * 11;
    }
    // Gravity, with a quick climb when the feet meet a higher step.
    const floor = floorHeight(avatar.position.x, avatar.position.z);
    const grounded = avatar.position.y <= floor + 0.04 && this.fallSpeed <= 0;
    if (grounded && keys.has('Space')) this.fallSpeed = JUMP_SPEED;
    if (avatar.position.y < floor && this.fallSpeed <= 0) {
      avatar.position.y = Math.min(floor, avatar.position.y + Math.max(floor - avatar.position.y, 0.05) * Math.min(1, dt * 16));
      this.fallSpeed = 0;
    } else {
      this.fallSpeed -= GRAVITY * dt;
      avatar.position.y += this.fallSpeed * dt;
      if (avatar.position.y <= floor && this.fallSpeed <= 0) { avatar.position.y = floor; this.fallSpeed = 0; }
    }
    swingLimbs(avatar, moving ? Math.sin(this.walkPhase) * 0.5 : 0);

    let closest: LocationDef | null = null;
    let best = 7.5;
    for (const l of LOCATIONS) {
      const spot = l.walkPos || (l.floor ? null : [l.pos[0], l.pos[2]]);
      if (!spot) continue;
      const d = Math.hypot(spot[0] - avatar.position.x, spot[1] - avatar.position.z);
      if (d < best) { best = d; closest = l; }
    }
    this.setNearby(closest);
  }
}
