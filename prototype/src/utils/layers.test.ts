import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './campusData';
import { applyLayerSettings, initialLayers } from './layers';

describe('applyLayerSettings', () => {
  it('leaves allowed layers as the visitor set them', () => {
    const state = initialLayers();
    state.wire.on = true;
    state.cars.on = false;
    const next = applyLayerSettings(state, DEFAULT_SETTINGS);
    expect(next.wire.on).toBe(true);
    expect(next.cars.on).toBe(false);
  });
  it('turns off and hides a layer the admin disallows', () => {
    const next = applyLayerSettings(initialLayers(), { ...DEFAULT_SETTINGS, showLabels: false });
    expect(next.labels).toEqual({ on: false, allowed: false });
  });
  it('restores the starting state when allowed again', () => {
    const off = applyLayerSettings(initialLayers(), { ...DEFAULT_SETTINGS, showStudents: false, showWireframe: false });
    const back = applyLayerSettings(off, DEFAULT_SETTINGS);
    expect(back.people).toEqual({ on: true, allowed: true });
    expect(back.wire).toEqual({ on: false, allowed: true });
  });
});
