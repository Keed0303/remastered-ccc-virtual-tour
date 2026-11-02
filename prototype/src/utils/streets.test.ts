import { describe, expect, it } from 'vitest';
import { COLLIDERS } from './physics';
import { PLAZA } from './seats';
import { BARRETO, BROSAS, CAMPUS_LAND, STREETS, SV_RIZAL_NORTH, distanceToPath, insidePolygon, offsetPath, pathLength, pointAlong, smoothPath } from './streets';

const SQUARE: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];

describe('path helpers', () => {
  it('measures a path and finds points along it', () => {
    const path: [number, number][] = [[0, 0], [10, 0], [10, 10]];
    expect(pathLength(path)).toBe(20);
    expect(pointAlong(path, 5)).toMatchObject({ x: 5, z: 0 });
    expect(pointAlong(path, 15)).toMatchObject({ x: 10, z: 5 });
  });

  it('keeps a point on the path past either end', () => {
    const path: [number, number][] = [[0, 0], [10, 0]];
    expect(pointAlong(path, -5)).toMatchObject({ x: 0, z: 0 });
    expect(pointAlong(path, 50)).toMatchObject({ x: 10, z: 0 });
  });

  it('gives a heading that faces the direction of travel', () => {
    expect(pointAlong([[0, 0], [0, 10]], 1).heading).toBeCloseTo(0);
    expect(pointAlong([[0, 0], [10, 0]], 1).heading).toBeCloseTo(Math.PI / 2);
  });

  it('offsets to the right of travel', () => {
    expect(offsetPath([[0, 0], [0, 10]], 2)[0]).toEqual([-2, 0]);
    expect(offsetPath([[0, 0], [10, 0]], 2)[0]).toEqual([0, 2]);
  });

  it('smooths through every control point', () => {
    const smooth = smoothPath([[0, 0], [10, 0], [10, 10]], 4);
    expect(smooth.length).toBe(9);
    expect(smooth[0]).toEqual([0, 0]);
    expect(smooth[4]).toEqual([10, 0]);
    expect(smooth[8]).toEqual([10, 10]);
  });

  it('measures distance to a path, and tests a polygon', () => {
    expect(distanceToPath(5, 3, [[0, 0], [10, 0]])).toBe(3);
    expect(distanceToPath(13, 0, [[0, 0], [10, 0]])).toBe(3);
    expect(insidePolygon(5, 5, SQUARE)).toBe(true);
    expect(insidePolygon(15, 5, SQUARE)).toBe(false);
  });
});

describe('the streets around the campus block', () => {
  it('follows the OpenStreetMap lengths within 5%', () => {
    const barreto = pathLength(BARRETO.path.filter(([, z], i) => z <= 94 || i === 0));
    expect(Math.abs(barreto - 204) / 204).toBeLessThan(0.05);
    expect(Math.abs(pathLength(BROSAS.path.filter(([x]) => x >= -12)) - 86) / 86).toBeLessThan(0.05);
  });

  it('curves Barreto St instead of turning a sharp corner', () => {
    const turn = BARRETO.path.filter(([x, z]) => x > 40 && z < 0);
    expect(turn.length).toBeGreaterThan(3);
    expect(distanceToPath(63, -54, BARRETO.path)).toBeGreaterThan(8);
  });

  it('narrows the block toward the north', () => {
    const eastAt = (target: number) => BARRETO.path.reduce((best, p) => (Math.abs(p[1] - target) < Math.abs(best[1] - target) ? p : best))[0];
    expect(eastAt(90)).toBeGreaterThan(eastAt(0));
    expect(eastAt(0)).toBeGreaterThan(eastAt(-30));
  });

  it('keeps Barreto St straight past the Old Building stairs', () => {
    for (const x of [14, 24, 34]) expect(distanceToPath(x, -54, BARRETO.path)).toBeLessThan(0.5);
  });

  it('makes the market road two lanes, right beside the plaza', () => {
    expect(SV_RIZAL_NORTH.width).toBeLessThanOrEqual(7);
    const gap = PLAZA.x0 - (SV_RIZAL_NORTH.path[0][0] + SV_RIZAL_NORTH.width / 2);
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(3);
  });

  it('runs no street through a solid building', () => {
    for (const street of STREETS) {
      const half = street.width / 2;
      for (let d = 0; d < pathLength(street.path); d++) {
        const { x, z } = pointAlong(street.path, d);
        const hit = COLLIDERS.find((c) => Math.hypot(Math.max(c.x0 - x, 0, x - c.x1), Math.max(c.z0 - z, 0, z - c.z1)) < half);
        expect(hit, `${street.name} at ${x.toFixed(1)},${z.toFixed(1)}`).toBeUndefined();
      }
    }
  });
});

describe('the campus land', () => {
  const inside = (x: number, z: number) => insidePolygon(x, z, CAMPUS_LAND);

  it('covers the three CCC buildings', () => {
    for (const [x, z] of [[-4, -39], [24, -48], [56, 0], [1, 7], [46, 49], [1, 53], [43, 89]]) expect(inside(x, z), `${x},${z}`).toBe(true);
  });

  it('leaves out the shops, the Health Office strip, and the south-east lots', () => {
    for (const [x, z] of [[17, 92], [53, 30], [52, 70], [62, 80]]) expect(inside(x, z), `${x},${z}`).toBe(false);
  });

  it('stays off the streets', () => {
    for (const [x, z] of CAMPUS_LAND) {
      for (const street of STREETS) expect(distanceToPath(x, z, street.path), `${street.name} at ${x},${z}`).toBeGreaterThanOrEqual(street.width / 2);
    }
  });
});
