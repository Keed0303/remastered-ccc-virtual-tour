import { describe, expect, it } from 'vitest';
import { cleanProfile, cleanSettings, isHexColor, validateRegistration } from './validation';

describe('cleanProfile', () => {
  it('rejects input with no usable id', () => {
    for (const raw of [null, undefined, 'x', {}, { id: '' }, { id: 5 }]) expect(cleanProfile(raw)).toBeNull();
  });
  it('keeps valid fields', () => {
    expect(cleanProfile({ id: 'a', name: ' Ana ', gender: 'female', skin: '#112233', hair: '#445566' }))
      .toEqual({ id: 'a', name: 'Ana', gender: 'female', skin: '#112233', hair: '#445566' });
  });
  it('replaces hostile or malformed values', () => {
    const p = cleanProfile({ id: 'x'.repeat(100), name: 'A', gender: 'admin', skin: 'url(evil)', hair: 7, role: 'admin' })!;
    expect(p.id).toHaveLength(64);
    expect(p.name).toBe('Student');
    expect(p.gender).toBe('male');
    expect(isHexColor(p.skin)).toBe(true);
    expect(isHexColor(p.hair)).toBe(true);
    expect(p).not.toHaveProperty('role');
  });
  it('limits long names to 24 characters', () => {
    expect(cleanProfile({ id: 'a', name: 'n'.repeat(40) })!.name).toHaveLength(24);
  });
});

describe('cleanSettings', () => {
  it('uses defaults for missing input', () => {
    expect(cleanSettings(null)).toEqual({ showWireframe: true, showStudents: true, showVehicles: true, showLabels: true, npcCount: 46 });
  });
  it('clamps the NPC count', () => {
    expect(cleanSettings({ npcCount: 999 }).npcCount).toBe(200);
    expect(cleanSettings({ npcCount: -5 }).npcCount).toBe(0);
    expect(cleanSettings({ npcCount: 'abc' }).npcCount).toBe(46);
    expect(cleanSettings({ npcCount: 10.4 }).npcCount).toBe(10);
  });
  it('ignores flags that are not booleans', () => {
    expect(cleanSettings({ showLabels: 'no' }).showLabels).toBe(true);
    expect(cleanSettings({ showLabels: false }).showLabels).toBe(false);
  });
});

describe('validateRegistration', () => {
  const good = { name: 'Ana', email: 'a@b.co', password: '12345678', gender: 'female' as const };
  it('accepts a complete form', () => expect(validateRegistration(good)).toBeNull());
  it.each([
    [{ name: 'A' }, /name/i],
    [{ name: 'n'.repeat(25) }, /name/i],
    [{ email: 'nope' }, /email/i],
    [{ password: 'short' }, /8 characters/],
    [{ gender: null }, /Female or Male/],
  ])('refuses %j', (change, message) => {
    expect(validateRegistration({ ...good, ...change })).toMatch(message);
  });
});
