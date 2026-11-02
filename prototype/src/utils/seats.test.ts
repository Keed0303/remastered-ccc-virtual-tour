import { describe, expect, it } from 'vitest';
import { COLLIDERS, WALK_BOUNDS, floorHeight } from './physics';
import { BENCHES, PLAZA, SEATS, SEAT_REACH, cleanSeat, nearestSeat } from './seats';

const blocked = (x: number, z: number) => COLLIDERS.some((c) => x > c.x0 - 0.5 && x < c.x1 + 0.5 && z > c.z0 - 0.5 && z < c.z1 + 0.5);

describe('SEATS', () => {
  it('gives every bench two seats', () => {
    expect(BENCHES).toHaveLength(10);
    expect(SEATS).toHaveLength(20);
  });
  it('faces every seat toward the middle of the plaza', () => {
    for (const seat of SEATS) expect(Math.sign(Math.sin(seat.rotation))).toBe(seat.x < PLAZA.axis ? 1 : -1);
  });
  it('leaves room to stand up, inside the walkable area', () => {
    for (const seat of SEATS) {
      expect(blocked(seat.standX, seat.z)).toBe(false);
      expect(seat.standX).toBeGreaterThan(WALK_BOUNDS.x0);
      expect(seat.standX).toBeLessThan(WALK_BOUNDS.x1);
      expect(seat.z).toBeGreaterThan(WALK_BOUNDS.z0);
      expect(seat.z).toBeLessThan(WALK_BOUNDS.z1);
      expect(floorHeight(seat.standX, seat.z)).toBeCloseTo(0.1);
    }
  });
  it('places the figure so the hips rest on the bench', () => {
    for (const seat of SEATS) expect(seat.y).toBeLessThan(0);
  });
});

describe('nearestSeat', () => {
  const first = SEATS[0];
  it('finds the closest seat in reach', () => {
    expect(nearestSeat(first.standX, first.z, new Set())).toBe(0);
  });
  it('finds nothing when too far', () => {
    expect(nearestSeat(PLAZA.axis, -90, new Set())).toBeNull();
    expect(nearestSeat(first.x + SEAT_REACH + 3, first.z, new Set())).toBeNull();
  });
  it('skips a taken seat for the free one beside it', () => {
    expect(nearestSeat(first.standX, first.z, new Set([0]))).toBe(1);
  });
  it('finds nothing when the whole bench is taken', () => {
    expect(nearestSeat(first.standX, first.z, new Set([0, 1]))).toBeNull();
  });
});

describe('cleanSeat', () => {
  it('accepts a real seat', () => {
    expect(cleanSeat(0)).toBe(0);
    expect(cleanSeat(SEATS.length - 1)).toBe(SEATS.length - 1);
  });
  it.each([[-1], [SEATS.length], [1.5], [Number.NaN], ['1'], [null], [undefined], [{}]])('refuses %j', (raw) => {
    expect(cleanSeat(raw)).toBeNull();
  });
});
