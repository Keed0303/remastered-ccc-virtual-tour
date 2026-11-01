import type { GameState } from '../../types/game';
import { LOCATIONS } from '../../utils/campusData';

export function PassportButton({ game, open, onToggle }: { game: GameState; open: boolean; onToggle: () => void }) {
  return (
    <button id="passport-fab" aria-expanded={open} aria-controls="passport" onClick={onToggle}>
      Passport <span id="fab-count">{game.stamps.length}/{LOCATIONS.length}</span>
    </button>
  );
}
