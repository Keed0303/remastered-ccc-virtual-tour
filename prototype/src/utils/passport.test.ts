import { describe, expect, it } from 'vitest';
import { FLOORS, LOCATIONS } from './campusData';
import { awardXp, emptyGame, levelOf, rankOf } from './passport';

describe('awardXp', () => {
  it('adds XP without changing the old state', () => {
    const before = emptyGame();
    const { game } = awardXp(before, 50);
    expect(game.xp).toBe(50);
    expect(before.xp).toBe(0);
  });
  it('reports a level up only when crossing a level', () => {
    expect(awardXp({ ...emptyGame(), xp: 150 }, 25).leveledUp).toBe(false);
    expect(awardXp({ ...emptyGame(), xp: 175 }, 25).leveledUp).toBe(true);
  });
  it('awards a badge once', () => {
    const first = awardXp({ ...emptyGame(), stamps: ['flagpole'] }, 50);
    expect(first.newBadges.map((b) => b.id)).toEqual(['first']);
    expect(awardXp(first.game, 50).newBadges).toEqual([]);
  });
  it('awards Campus Guide for every location', () => {
    const { game } = awardXp({ ...emptyGame(), stamps: LOCATIONS.map((l) => l.id) }, 50);
    expect(game.badges).toContain('guide');
  });
});

describe('ranks', () => {
  it('stop at the last rank', () => {
    expect(rankOf(0)).toBe('Freshman');
    expect(rankOf(100000)).toBe('Graduate');
    expect(levelOf(450)).toBe(2);
  });
});

describe('campus data', () => {
  it('has unique location ids, and quiz answers that exist', () => {
    expect(new Set(LOCATIONS.map((l) => l.id)).size).toBe(LOCATIONS.length);
    for (const l of LOCATIONS) if (l.quiz) expect(l.quiz.options[l.quiz.answer]).toBeDefined();
  });
  it('derives real room rectangles', () => {
    for (const floor of Object.values(FLOORS)) {
      for (const r of floor.rooms) {
        expect(r.x1).toBeGreaterThan(r.x0);
        expect(r.z1).toBeGreaterThan(r.z0);
      }
    }
  });
});
