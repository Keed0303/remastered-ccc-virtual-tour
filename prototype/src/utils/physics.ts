import type { Collider, Rect } from '../types/campus';

// Solid footprints used for on-foot collisions.
export const COLLIDERS: Collider[] = [
  // Old Building exterior. The door gap between x 21.7 and 26.3 stays open.
  { x0: -4, x1: 10, z0: -39, z1: -24 }, { x0: 38, x1: 52, z0: -39, z1: -24 }, { x0: 10, x1: 21.7, z0: -39.6, z1: -37.4 },
  { x0: 26.3, x1: 38, z0: -39.6, z1: -37.4 }, { x0: 3.5, x1: 14.2, z0: -50, z1: -39, top: 3 }, { x0: 33.8, x1: 44.5, z0: -50, z1: -39, top: 3 },
  { x0: 15.7, x1: 16.9, z0: -45.2, z1: -44, top: 0 }, { x0: 31.1, x1: 32.3, z0: -45.2, z1: -44, top: 0 },
  { x0: -5, x1: 10, z0: -24, z1: 6 }, { x0: 38, x1: 57, z0: -24, z1: -16 }, { x0: 46, x1: 57, z0: -16, z1: 6 }, { x0: 10, x1: 46, z0: -5, z1: 6 }, { x0: 38, x1: 40, z0: -16, z1: -5 },
  // Lobby walls, corridors, stage, and furniture.
  { x0: 16.5, x1: 21.3, z0: -20, z1: -5 }, { x0: 26.7, x1: 31.5, z0: -20, z1: -5 }, { x0: 10, x1: 13.5, z0: -20, z1: -5 }, { x0: 34.5, x1: 38, z0: -20, z1: -5 },
  { x0: 21, x1: 27, z0: -15.5, z1: -5 }, { x0: 13.5, x1: 16.5, z0: -6, z1: -5 }, { x0: 31.5, x1: 34.5, z0: -6, z1: -5 },
  { x0: 19.6, x1: 21.3, z0: -22.2, z1: -19.7, top: 3.2 }, { x0: 26.7, x1: 28.4, z0: -22.2, z1: -19.7, top: 3.2 },
  { x0: 10, x1: 16.3, z0: -24.5, z1: -23.4, top: 2.9 }, { x0: 10, x1: 11.4, z0: -23.4, z1: -20, top: 2.9 }, { x0: 33.5, x1: 37.8, z0: -25, z1: -22.4, top: 2.7 }, { x0: 31.8, x1: 33, z0: -22.6, z1: -21.5, top: 3.3 },
  { x0: 21.5, x1: 21.9, z0: -37.4, z1: -35.1, top: 0 }, { x0: 26.1, x1: 26.5, z0: -37.4, z1: -35.1, top: 0 },
  // Other buildings and landmarks.
  { x0: 0, x1: 47, z0: 6, z1: 50 }, { x0: 0, x1: 44, z0: 52, z1: 90 }, { x0: 49.5, x1: 57.5, z0: 8, z1: 48 }, { x0: 46, x1: 57.5, z0: 52, z1: 88 },
  { x0: 4, x1: 30, z0: 90, z1: 94, top: 3.3 }, { x0: 53, x1: 66, z0: -92, z1: -74 }, { x0: 28.4, x1: 39.6, z0: -79.6, z1: -68.4, top: 3 },
];

// Height of the walkable surface at a point. This matches the steps built in scene/world.
export function floorHeight(x: number, z: number): number {
  if (x >= 14.2 && x <= 33.8 && z >= -50 && z < -45.94) return (1.5 * (Math.floor((z + 50) / 0.58) + 1)) / 8;
  if (x >= 14.2 && x <= 33.8 && z >= -45.94 && z < -38) return 1.5;
  if (x >= 10 && x <= 38 && z >= -38 && z <= -5) {
    if (x >= 21.3 && x <= 26.7 && z >= -22.2 && z < -19.2) return 1.84 + 0.17 * (Math.floor((z + 22.2) / 0.5) + 1);
    if (x >= 21.3 && x <= 26.7 && z >= -19.2) return 2.86;
    if (x >= 16 && x <= 32 && z >= -25 && z < -20) return 1.84;
    if (x >= 15 && x <= 33 && z >= -26 && z < -20) return 1.67;
    return 1.5;
  }
  if (x >= 18 && x <= 50 && z >= -125 && z < -58) return 0.1;
  return 0;
}

// The highest the third-person camera may go at a point, so it stays under ceilings.
export function cameraCeiling(x: number, z: number): number {
  if (x >= 15.5 && x <= 32.5 && z >= -46.2 && z < -38) return 6;
  if (x >= 10 && x <= 38 && z >= -38 && z <= -5) {
    if (z >= -20) {
      if (x < 17 || x > 31) return 4.15;
      return 5.6;
    }
    return 5.65;
  }
  return Infinity;
}

// True when a point is inside the lobby or its corridors.
export function indoorBounds(x: number, z: number): boolean {
  return z >= -38.2 && z <= -5 && x >= 10 && x <= 38;
}

export const WALK_BOUNDS: Rect = { x0: -16, x1: 66, z0: -124, z1: 101 };
