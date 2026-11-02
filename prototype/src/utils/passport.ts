import type { GameState } from '../types/game';
import { BADGES, RANKS } from './campusData';

const SAVE_KEY = 'ccc-campus-passport-v1';
export const XP_PER_LEVEL = 200;
export const STAMP_XP = 50;
export const QUIZ_XP = 25;

export const emptyGame = (): GameState => ({ xp: 0, stamps: [], quiz: [], badges: [] });

export function loadGame(): GameState {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (s && Array.isArray(s.stamps) && Array.isArray(s.quiz)) return { xp: 0, badges: [], ...s };
  } catch { /* Private windows can block storage. */ }
  return emptyGame();
}

export function saveGame(game: GameState) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch { /* Progress stays for this visit only. */ }
}

export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL);
export const rankOf = (xp: number) => RANKS[Math.min(levelOf(xp), RANKS.length - 1)];

// Adds XP to a changed state and works out any level or badges it earned.
export function awardXp(game: GameState, amount: number) {
  const next: GameState = { ...game, xp: game.xp + amount, badges: [...game.badges] };
  const newBadges = BADGES.filter((b) => !next.badges.includes(b.id) && b.test(next));
  next.badges.push(...newBadges.map((b) => b.id));
  return { game: next, leveledUp: levelOf(next.xp) > levelOf(game.xp), newBadges };
}
