export type Vec3 = [number, number, number];
export type RoomKind = 'class' | 'lab' | 'comlab' | 'office' | 'hall' | 'lobby' | 'library' | 'closed' | 'garden' | 'void';
export type FloorKey = 'ob_gf' | 'ob_lg' | 'nb_1' | 'nb_2' | 'nb_3';

export interface Rect { x0: number; x1: number; z0: number; z1: number }
export interface Room extends Rect { n: string; k: RoomKind }
export interface FloorDef { name: string; building: 'old' | 'new'; foot: Rect; rooms: Room[] }

export interface Quiz { q: string; options: string[]; answer: number }
export interface LocationDef {
  id: string;
  name: string;
  kind: string;
  floor: FloorKey | null;
  pos: Vec3;
  walkPos?: [number, number];
  pano: string;
  text: string[];
  quiz?: Quiz;
}

export interface BuildingLabel { id: string; name: string; pos: Vec3; big: true; view?: FloorKey; note?: string }
export interface ViewDef { id: string; name: string; floor?: FloorKey; cam: Vec3; target: Vec3 }
export interface ThemeDef {
  id: string; name: string; sky: string; fog: string; sun: string; sunI: number;
  hemi: number; hemiG: string; pos: Vec3; glow: number; lamps: number;
}
// A solid footprint. `top` lets the camera pass above it, and top 0 means the camera ignores it.
export interface Collider extends Rect { top?: number }
