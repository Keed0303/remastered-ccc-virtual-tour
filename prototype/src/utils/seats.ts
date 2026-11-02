// Where the plaza benches are and how to sit on them. world/ground.ts draws from BENCHES.
const PLAZA_X0 = 18, PLAZA_X1 = 50;
const SEAT_TOP = 0.62;
// A figure's hips are this far above its feet, after its 1.15 scale.
const HIP_HEIGHT = 0.736;
const SEAT_OFFSET = 0.7;
const SEAT_FORWARD = 0.12;
const STAND_FORWARD = 1.2;

export const SEAT_REACH = 1.8;

export interface Bench { x: number; z: number; side: 1 | -1 }
export interface Seat { x: number; y: number; z: number; rotation: number; standX: number }

// Down both sides of the plaza, each facing the middle.
export const BENCHES: Bench[] = [];
for (let z = -120; z < -55; z += 13) {
  BENCHES.push({ x: PLAZA_X0 + 1.2, z, side: 1 }, { x: PLAZA_X1 - 1.2, z, side: -1 });
}

export const SEATS: Seat[] = BENCHES.flatMap(({ x, z, side }) => [-SEAT_OFFSET, SEAT_OFFSET].map((offset) => ({
  x: x + side * SEAT_FORWARD,
  y: SEAT_TOP - HIP_HEIGHT,
  z: z + offset,
  rotation: (side * Math.PI) / 2,
  standX: x + side * STAND_FORWARD,
})));

export function nearestSeat(x: number, z: number, taken: ReadonlySet<number>) {
  let closest: number | null = null;
  let best = SEAT_REACH;
  SEATS.forEach((seat, i) => {
    const d = Math.hypot(seat.x - x, seat.z - z);
    if (d < best && !taken.has(i)) { best = d; closest = i; }
  });
  return closest as number | null;
}

// A seat number from another client is untrusted.
export const cleanSeat = (raw: unknown) => (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < SEATS.length ? raw : null);
