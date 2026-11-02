import type { Collider, Rect } from '../types/campus';
import { PLAZA } from './seats';

// Neighbouring buildings east of Barreto St, and houses at the block's south-east corner: x0, z0, x1, z1.
export const EAST_BLOCKS = [[71, -40, 94, -18], [71, -14, 96, 8], [71, 12, 92, 34], [74, 38, 100, 60], [76, 64, 96, 88]];
export const LOT_HOUSES = [[59, 60, 64.5, 74], [59, 76, 64.5, 90]];
// The plaza's landmarks, the shops east of it, and the shop row across S.V. Rizal St.
export const MONUMENT = [34, -98] as const;
export const FLAGPOLE = [34.6, -121.5] as const;
export const ARCH_Z = -118;
export const EAST_OF_PLAZA = [[58, -125, 78, -96]];
export const SHOPS = [[0.5, -82, 7.5, -74], [0.5, -90, 7.5, -82], [0.5, -99, 7.5, -90]];
export const STALLS = [[2, -71, 5.5, -68], [2, -67, 5.5, -64], [2, -63, 5.5, -60], [6.8, -74.5, 8.3, -72.5]];
// Trees outside the buildings: x, z, scale, tone. world/ground.ts draws them from here.
export const TREES = [
  [20, -75, 1.9, 2], [20, -100, 1.9, 0], [48, -72, 1.9, 1], [48, -96, 1.9, 2], [53, -112, 1.9, 1], [53, -67, 1.9, 0],
  [68, -76, 1.2, 0], [72, -62, 1.2, 1], [-6, -70, 1.2, 2], [-5, -90, 1.2, 0],
  [-4.3, 56, 0.75, 0], [-6.2, 10, 0.75, 1], [-6.2, 30, 0.75, 2],
];

// Solid footprints used for on-foot collisions.
export const COLLIDERS: Collider[] = [
  ...[...EAST_BLOCKS, ...LOT_HOUSES, ...EAST_OF_PLAZA, ...SHOPS].map(([x0, z0, x1, z1]) => ({ x0, x1, z0, z1 })),
  ...STALLS.map(([x0, z0, x1, z1]) => ({ x0, x1, z0, z1, top: 3 })),
  { x0: -39, x1: -15, z0: -70, z1: -50 },
  // Tree trunks, with the camera free to pass above.
  ...TREES.map(([x, z, s]) => {
    const half = Math.max(0.6, 0.5 * s);
    return { x0: x - half, x1: x + half, z0: z - half, z1: z + half, top: 3 };
  }),
  // Plaza fences and planters. The Barreto St entry and the north end stay open.
  { x0: PLAZA.x0 - 1.4, x1: PLAZA.x0 + 0.25, z0: PLAZA.z0 + 2, z1: -61, top: 2.4 },
  { x0: PLAZA.x1 - 0.25, x1: PLAZA.x1 + 0.4, z0: PLAZA.z0 + 2, z1: -61, top: 2.4 },
  { x0: PLAZA.x0, x1: PLAZA.axis - 6, z0: -65, z1: -61, top: 1.6 },
  { x0: PLAZA.axis + 6, x1: PLAZA.x1, z0: -65, z1: -61, top: 1.6 },
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
  { x0: 4, x1: 30, z0: 90, z1: 94, top: 3.3 }, { x0: 53, x1: 66, z0: -92, z1: -74 }, { x0: MONUMENT[0] - 1.3, x1: MONUMENT[0] + 1.3, z0: MONUMENT[1] - 1.3, z1: MONUMENT[1] + 1.3, top: 1.5 },
  // The arch's two sides, and the kiosk on Barreto St.
  { x0: 28.9, x1: 31, z0: ARCH_Z - 0.95, z1: ARCH_Z + 0.95 }, { x0: 37, x1: 39.1, z0: ARCH_Z - 0.95, z1: ARCH_Z + 0.95 }, { x0: 51.2, x1: 53.8, z0: -63, z1: -60.4 },
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

export const WALK_BOUNDS: Rect = { x0: -16, x1: 75, z0: -136, z1: 101 };
