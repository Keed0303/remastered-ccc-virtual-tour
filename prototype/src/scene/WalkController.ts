import * as THREE from 'three';
import type { LocationDef } from '../types/campus';
import { LOCATIONS } from '../utils/campusData';
import type { SeatState } from '../types/scene';
import { COLLIDERS, WALK_BOUNDS, floorHeight } from '../utils/physics';
import { SEATS, nearestSeat } from '../utils/seats';
import { sitLimbs, swingLimbs } from './characters/figure';

const GRAVITY = 19, JUMP_SPEED = 5.8, STEP_LIMIT = 0.5;
const R = 0.5;
const SIT_TIME = 0.45, STAND_TIME = 0.35, SIT_SWAY = 0.06;
const blocked = (x: number, z: number) => COLLIDERS.some((c) => x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R);

// One eased move between standing and sitting: position, facing, and pose.
interface SeatMove { from: THREE.Vector3; to: THREE.Vector3; fromRot: number; toRot: number; fromBlend: number; toBlend: number; t: number; duration: number }

// The player on foot. Input arrives through `keys` and `stick`, and everything runs per frame.
export class WalkController {
  readonly keys = new Set<string>();
  readonly stick = { x: 0, y: 0, id: null as number | null };
  nearby: LocationDef | null = null;
  seat: number | null = null;
  nearSeat: number | null = null;
  sitBlend = 0;
  private standing = false;
  private seatMove: SeatMove | null = null;
  private waitForRelease = false;
  private walkPhase = 0;
  private fallSpeed = 0;
  private fwd = new THREE.Vector3();
  private avatar: THREE.Object3D;
  private getYaw: () => number;
  private onNearby: (location: LocationDef | null) => void;
  private takenSeats: () => ReadonlySet<number>;
  private onSeat: (state: SeatState) => void;

  constructor(avatar: THREE.Object3D, getYaw: () => number, onNearby: (location: LocationDef | null) => void, takenSeats: () => ReadonlySet<number>, onSeat: (state: SeatState) => void) {
    this.avatar = avatar;
    this.getYaw = getYaw;
    this.onNearby = onNearby;
    this.takenSeats = takenSeats;
    this.onSeat = onSeat;
  }

  spawn() {
    this.avatar.position.set(29, floorHeight(29, -116), -116);
    this.avatar.rotation.y = Math.PI;
    this.fallSpeed = 0;
    this.seat = null;
    this.seatMove = null;
    this.standing = false;
    this.sitBlend = 0;
  }

  stop() {
    this.keys.clear();
    if (this.seat !== null) {
      const seat = SEATS[this.seat];
      this.avatar.position.set(seat.standX, floorHeight(seat.standX, seat.z), seat.z);
      this.finishStanding();
    }
    this.setNearby(null);
    this.setNearSeat(null);
  }

  // E or the touch button. Returns whether it did anything, so E can fall through to check in.
  useSeat() {
    if (this.seat !== null) {
      this.stand();
      return true;
    }
    if (this.nearSeat === null) return false;
    this.sit(this.nearSeat);
    return true;
  }

  private startSeatMove(x: number, y: number, z: number, toRot: number, toBlend: number, duration: number) {
    const { avatar } = this;
    this.seatMove = { from: avatar.position.clone(), to: new THREE.Vector3(x, y, z), fromRot: avatar.rotation.y, toRot, fromBlend: this.sitBlend, toBlend, t: 0, duration };
  }

  private sit(index: number) {
    const seat = SEATS[index];
    this.seat = index;
    this.standing = false;
    // Keys or a joystick already held have to be let go, or walking up and sitting would stand straight back up.
    this.waitForRelease = true;
    this.fallSpeed = 0;
    this.startSeatMove(seat.x, seat.y, seat.z, seat.rotation, 1, SIT_TIME);
    this.setNearby(null);
    this.nearSeat = null;
    this.reportSeat();
  }

  private stand() {
    if (this.standing) return;
    const seat = SEATS[this.seat!];
    this.standing = true;
    this.startSeatMove(seat.standX, floorHeight(seat.standX, seat.z), seat.z, this.avatar.rotation.y, 0, STAND_TIME);
  }

  private finishStanding() {
    this.seat = null;
    this.seatMove = null;
    this.standing = false;
    this.sitBlend = 0;
    swingLimbs(this.avatar, 0);
    // Set now, so E works again straight away.
    this.nearSeat = nearestSeat(this.avatar.position.x, this.avatar.position.z, this.takenSeats());
    this.reportSeat();
  }

  private updateSeated(dt: number, hasInput: boolean) {
    if (!hasInput) this.waitForRelease = false;
    else if (!this.waitForRelease) this.stand();

    const { seatMove, avatar } = this;
    if (seatMove) {
      seatMove.t = Math.min(1, seatMove.t + dt / seatMove.duration);
      const eased = THREE.MathUtils.smoothstep(seatMove.t, 0, 1);
      avatar.position.lerpVectors(seatMove.from, seatMove.to, eased);
      const turn = Math.atan2(Math.sin(seatMove.toRot - seatMove.fromRot), Math.cos(seatMove.toRot - seatMove.fromRot));
      avatar.rotation.y = seatMove.fromRot + turn * eased;
      this.sitBlend = THREE.MathUtils.lerp(seatMove.fromBlend, seatMove.toBlend, eased);
      sitLimbs(avatar, this.sitBlend);
      if (seatMove.t < 1) return;
      this.seatMove = null;
      if (this.standing) this.finishStanding();
      return;
    }
    // A small swing of the legs while resting on the bench.
    this.walkPhase += dt * 1.6;
    sitLimbs(avatar, this.sitBlend, Math.sin(this.walkPhase) * SIT_SWAY);
  }

  private setNearSeat(next: number | null) {
    if (next === this.nearSeat) return;
    this.nearSeat = next;
    this.reportSeat();
  }

  private reportSeat() {
    this.onSeat({ seated: this.seat !== null, canSit: this.nearSeat !== null });
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
    if (this.seat !== null) {
      this.updateSeated(dt, !!moving || keys.has('Space'));
      return;
    }
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
    this.setNearSeat(nearestSeat(avatar.position.x, avatar.position.z, this.takenSeats()));
    // E sits first near a bench, so only one action is on offer.
    this.setNearby(this.nearSeat === null ? closest : null);
  }
}
