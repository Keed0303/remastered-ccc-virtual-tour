// Streets around the campus block. The shapes come from OpenStreetMap (© OpenStreetMap contributors, ODbL),
// moved only as far as the existing buildings need. See devnote/2026-11-03-route-street-view-survey.md.
export type PathPoint = [number, number];
export interface Street { name: string; width: number; path: PathPoint[] }

// Catmull-Rom through every control point, with `steps` segments between each pair.
export function smoothPath(points: PathPoint[], steps = 8): PathPoint[] {
  const out: PathPoint[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, points.length - 1)];
    for (let s = 1; s <= steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const at = (k: 0 | 1) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
      out.push(s === steps ? p2 : [at(0), at(1)]);
    }
  }
  return out;
}

export function pathLength(path: PathPoint[]) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return total;
}

// The position and facing at a distance along a path. The heading matches rotation.y on a figure facing +z.
export function pointAlong(path: PathPoint[], distance: number) {
  let left = Math.max(distance, 0);
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i];
    const length = Math.hypot(bx - ax, bz - az);
    if (left <= length || i === path.length - 1) {
      const t = length ? Math.min(left / length, 1) : 0;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, heading: Math.atan2(bx - ax, bz - az) };
    }
    left -= length;
  }
  return { x: path[0][0], z: path[0][1], heading: 0 };
}

// The same path moved sideways. A positive distance goes to the right of travel.
export function offsetPath(path: PathPoint[], distance: number): PathPoint[] {
  return path.map(([x, z], i) => {
    const [ax, az] = path[Math.max(i - 1, 0)], [bx, bz] = path[Math.min(i + 1, path.length - 1)];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    return [x - ((bz - az) / length) * distance + 0, z + ((bx - ax) / length) * distance + 0];
  });
}

export function distanceToPath(x: number, z: number, path: PathPoint[]) {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

export function insidePolygon(x: number, z: number, outline: PathPoint[]) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, az] = outline[i], [bx, bz] = outline[j];
    if (az > z !== bz > z && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside;
  }
  return inside;
}

// South of Barreto St it passes the campus. North of it, a two-lane stretch runs between the plaza and the market.
export const SV_RIZAL: Street = { name: 'S.V. Rizal St', width: 10, path: smoothPath([[-6, -54], [-7, -50], [-10, -42], [-12, -34], [-12, 100], [-12, 220]]) };
export const SV_RIZAL_NORTH: Street = { name: 'S.V. Rizal St north', width: 7, path: [[12.5, -240], [12.5, -54]] };
export const BARRETO: Street = {
  name: 'Barreto St',
  width: 8,
  path: smoothPath([[-6, -54], [14, -54], [34, -54], [44, -54], [48, -54], [54, -51], [59.5, -41], [63.5, -24], [64.5, -5], [64.5, 20], [69.5, 70], [70.5, 94], [73, 220]]),
};
export const BROSAS: Street = { name: 'Brosas St', width: 6, path: [[-120, 101], [-12, 100.2], [70.5, 94]] };
export const BURGOS: Street = { name: 'Burgos St', width: 8, path: [[-120, -127], [12.5, -131], [70, -135], [160, -139]] };
export const STREETS = [SV_RIZAL, SV_RIZAL_NORTH, BARRETO, BROSAS, BURGOS];

// The ground inside the streets. It is not all CCC: see CAMPUS_LAND.
export const BLOCK: PathPoint[] = [[-6.9, -34], [-4.6, -41], [1, -50], [38, -50], [50, -46.5], [55, -38.5], [59, -24], [60.5, -5], [60.5, 20], [65.5, 70], [66.3, 90.8], [-6.9, 96.4]];
// CCC's own land: the Old Building, the blue-roof building, and the New Building.
export const CAMPUS_LAND: PathPoint[] = [[-6.9, -34], [-4.6, -41], [1, -50], [38, -50], [50, -46.5], [55, -38.5], [58, -28], [58, 6.5], [48.5, 6.5], [48.5, 50.5], [45, 50.5], [45, 91], [-6.9, 91]];
