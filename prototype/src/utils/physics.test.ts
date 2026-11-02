import { describe, expect, it } from 'vitest';
import { COLLIDERS, TREES, WALK_BOUNDS, cameraCeiling, floorHeight, indoorBounds } from './physics';
import { PLAZA } from './seats';

describe('floorHeight', () => {
  it('is flat ground outside', () => expect(floorHeight(-100, 0)).toBe(0));
  it('is the raised paving on the plaza', () => expect(floorHeight(30, -100)).toBe(0.1));
  it('is the lobby floor inside', () => expect(floorHeight(24, -30)).toBe(1.5));
  it('climbs the orange stair one small step at a time', () => {
    let last = 0;
    for (let z = -50; z < -45.94; z += 0.1) {
      const h = floorHeight(24, z);
      expect(h).toBeGreaterThanOrEqual(last);
      expect(h - last).toBeLessThanOrEqual(0.5);
      last = h;
    }
    expect(floorHeight(24, -45.9)).toBe(1.5);
  });
});

describe('camera and indoor limits', () => {
  it('has no ceiling outside', () => expect(cameraCeiling(-100, 0)).toBe(Infinity));
  it('stays under the lobby ceiling', () => expect(cameraCeiling(24, -30)).toBeLessThan(6));
  it('knows the lobby is indoors and the plaza is not', () => {
    expect(indoorBounds(24, -30)).toBe(true);
    expect(indoorBounds(30, -100)).toBe(false);
  });
});

describe('colliders', () => {
  it('are all well-formed rectangles', () => {
    for (const c of COLLIDERS) {
      expect(c.x1).toBeGreaterThan(c.x0);
      expect(c.z1).toBeGreaterThan(c.z0);
    }
  });
  it('stop a walker at trees, fences, and planters', () => {
    const blocked = (x: number, z: number) => COLLIDERS.some((c) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1);
    for (const [x, z] of TREES) expect(blocked(x, z), `tree at ${x},${z}`).toBe(true);
    for (const z of [-110, -90, -70]) {
      expect(blocked(PLAZA.x0, z), `west fence at ${z}`).toBe(true);
      expect(blocked(PLAZA.x1, z), `east fence at ${z}`).toBe(true);
    }
    expect(blocked(PLAZA.x0 + 4, -63)).toBe(true);
    expect(blocked(PLAZA.x1 - 4, -63)).toBe(true);
  });
  it('leave the plaza entry and its north end open', () => {
    const blocked = (x: number, z: number) => COLLIDERS.some((c) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1);
    for (const x of [PLAZA.axis - 5, PLAZA.axis, PLAZA.axis + 5]) expect(blocked(x, -63), `entry at ${x}`).toBe(false);
    for (const x of [PLAZA.x0 + 1, PLAZA.axis, PLAZA.x1 - 1]) expect(blocked(x, PLAZA.z0 + 1), `north at ${x}`).toBe(false);
  });
  it('leave the main entrance and the walking start clear', () => {
    const blocked = (x: number, z: number) => COLLIDERS.some((c) => x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1);
    expect(blocked(24, -38)).toBe(false);
    expect(blocked(29, -116)).toBe(false);
    expect(29).toBeGreaterThan(WALK_BOUNDS.x0);
  });
});
