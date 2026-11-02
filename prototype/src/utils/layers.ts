import type { SiteSettings } from '../types/backend';
import type { LayerId } from '../types/scene';

export const LAYERS: { id: LayerId; name: string; startsOn: boolean; setting: keyof SiteSettings }[] = [
  { id: 'people', name: 'Students', startsOn: true, setting: 'showStudents' },
  { id: 'cars', name: 'Vehicles', startsOn: true, setting: 'showVehicles' },
  { id: 'labels', name: 'Labels', startsOn: true, setting: 'showLabels' },
  { id: 'wire', name: 'Wireframe', startsOn: false, setting: 'showWireframe' },
];

export type LayerState = Record<LayerId, { on: boolean; allowed: boolean }>;

export function initialLayers(): LayerState {
  return Object.fromEntries(LAYERS.map((l) => [l.id, { on: l.startsOn, allowed: true }])) as LayerState;
}

// A layer the admin hides turns off. When allowed again, it returns to its starting state.
export function applyLayerSettings(state: LayerState, settings: SiteSettings): LayerState {
  const next = { ...state };
  for (const l of LAYERS) {
    const allowed = Boolean(settings[l.setting]);
    const { on, allowed: wasAllowed } = state[l.id];
    next[l.id] = { allowed, on: !allowed ? false : wasAllowed ? on : l.startsOn };
  }
  return next;
}
