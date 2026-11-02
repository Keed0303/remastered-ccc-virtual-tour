import type { LocationDef } from './campus';

export type SceneMode = 'orbit' | 'pano' | 'walk';
export type LayerId = 'people' | 'cars' | 'labels' | 'wire';

// The scene reports changes through these, never per frame, so React state stays cheap.
export interface SceneEvents {
  onViewChange?: (viewId: string) => void;
  onModeChange?: (mode: SceneMode, walking: boolean) => void;
  onNearbyChange?: (location: LocationDef | null) => void;
  onRoomClick?: (name: string, x: number, y: number) => void;
  onPanoError?: () => void;
  onMouseLockChange?: (locked: boolean) => void;
  onEscape?: () => void;
  onCheckInKey?: () => void;
}

// DOM owned by React that the scene writes to every frame.
export interface SceneElements {
  host: HTMLElement;
  labels: HTMLElement;
  bubbles: HTMLElement;
  compass: HTMLElement;
}
