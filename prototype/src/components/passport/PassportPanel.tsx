import type { GameState } from '../../types/game';
import { BADGES, LOCATIONS } from '../../utils/campusData';
import { XP_PER_LEVEL, levelOf, rankOf } from '../../utils/passport';

interface PassportPanelProps {
  game: GameState;
  passportCount: number | null;
  onlineCount: number;
  onClose: () => void;
  onStamp: (id: string) => void;
  onReset: () => void;
}

function countText(count: number | null) {
  if (count === null) return 'Passports issued: …';
  return count < 0 ? '' : `Passports issued: ${count}`;
}

export function PassportPanel({ game, passportCount, onlineCount, onClose, onStamp, onReset }: PassportPanelProps) {
  return (
    <section id="passport" className="panel-light" aria-label="Student Passport">
      <button id="passport-close" className="dialog-x" aria-label="Close Student Passport" onClick={onClose}>✕</button>
      <header>
        <div>
          <p className="eyebrow dark">Student Passport</p>
          <strong id="level">Level {levelOf(game.xp) + 1} {rankOf(game.xp)}</strong>
        </div>
        <span id="xp">{game.xp} XP</span>
      </header>
      <div className="bar"><i id="xp-bar" style={{ width: `${((game.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%` }} /></div>
      <div id="stamps">
        {LOCATIONS.map((l, i) => {
          const got = game.stamps.includes(l.id);
          return (
            <button key={l.id} className={`stamp${got ? ' got' : ''}`} title={l.name} aria-label={`${l.name}${got ? ', stamped' : ''}`} onClick={() => onStamp(l.id)}>
              {got ? '★' : i + 1}
            </button>
          );
        })}
      </div>
      <div id="community">
        <span id="passport-count">{countText(passportCount)}</span>
        <span id="online-count" hidden={!onlineCount}>{onlineCount} online</span>
      </div>
      <div id="badges">
        {BADGES.map((b) => {
          const got = game.badges.includes(b.id);
          return <span key={b.id} className={`badge${got ? ' got' : ''}`} title={b.name + (got ? '' : ' (locked)')}>{b.icon}</span>;
        })}
      </div>
      <button id="reset" className="link" onClick={onReset}>Reset progress</button>
    </section>
  );
}
