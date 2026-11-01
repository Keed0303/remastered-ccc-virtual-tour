import { useCallback, useRef, useState } from 'react';
import type { GameState } from '../types/game';
import { QUIZ_XP, STAMP_XP, awardXp, emptyGame, loadGame, saveGame } from '../utils/passport';
import { useToast } from './useToast';

// Student Passport progress, saved in this browser.
export function usePassport() {
  const toast = useToast();
  const [game, setGame] = useState<GameState>(loadGame);
  const [burst, setBurst] = useState(0);
  const current = useRef(game);

  const commit = useCallback((next: GameState) => {
    current.current = next;
    setGame(next);
    saveGame(next);
  }, []);

  const award = useCallback((state: GameState, amount: number, reason: string) => {
    const { game: next, leveledUp, newBadges } = awardXp(state, amount);
    toast(`+${amount} XP · ${reason}`);
    if (leveledUp) toast('Level up!');
    for (const b of newBadges) {
      toast(`${b.icon} Badge earned: ${b.name}`);
      setBurst((n) => n + 1);
    }
    commit(next);
  }, [commit, toast]);

  const checkIn = useCallback((id: string) => {
    const state = current.current;
    if (state.stamps.includes(id)) return;
    award({ ...state, stamps: [...state.stamps, id] }, STAMP_XP, 'Passport stamped');
    setBurst((n) => n + 1);
  }, [award]);

  const answerQuiz = useCallback((id: string) => {
    const state = current.current;
    if (state.quiz.includes(id)) return;
    award({ ...state, quiz: [...state.quiz, id] }, QUIZ_XP, 'Correct answer');
  }, [award]);

  const reset = useCallback(() => {
    commit(emptyGame());
    toast('Progress reset');
  }, [commit, toast]);

  return { game, burst, checkIn, answerQuiz, reset };
}
