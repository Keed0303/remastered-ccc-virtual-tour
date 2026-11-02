// Where the plaza benches are and how to sit on them. world/ground.ts draws from BENCHES.
export const PLAZA = { x0: 18, x1: 50, z0: -125, z1: -58, axis: 34 };
const SEAT_TOP = 0.62;
// A figure's hips are this far above its feet, after its 1.15 scale.
const HIP_HEIGHT = 0.736;
const SEAT_OFFSET = 0.7;
const SEAT_FORWARD = 0.12;
const STAND_FORWARD = 1.2;

export const SEAT_REACH = 1.8;

export interface Bench { x: number; z: number; side: 1 | -1 }
export interface Seat { x: number; y: number; z: number; rotation: number; standX: number }

// Under the pergolas on both sides of the plaza, each facing the middle.
export const BENCHES: Bench[] = [];
for (const z of [-110, -102, -94, -86, -78]) {
  BENCHES.push({ x: PLAZA.x0 + 4.5, z, side: 1 }, { x: PLAZA.x1 - 4.5, z, side: -1 });
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
