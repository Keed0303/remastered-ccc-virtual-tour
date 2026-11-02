import type { LocationDef } from '../../types/campus';
import type { GameState } from '../../types/game';
import { STAMP_XP } from '../../utils/passport';
import { QuizPanel } from './QuizPanel';

interface InfoCardProps {
  location: LocationDef;
  game: GameState;
  onClose: () => void;
  onPano: (location: LocationDef) => void;
  onCheckIn: (id: string) => void;
  onCorrect: (id: string) => void;
}

export function InfoCard({ location: l, game, onClose, onPano, onCheckIn, onCorrect }: InfoCardProps) {
  const got = game.stamps.includes(l.id);
  return (
    <article id="card" className="panel-light" aria-live="polite">
      <button id="card-close" aria-label="Close" onClick={onClose}>✕</button>
      <div id="card-photo" style={{ backgroundImage: `url(${l.pano})` }} />
      <div className="card-body">
        <p className="eyebrow dark" id="card-kind">{l.kind}</p>
        <h2 id="card-title">{l.name}</h2>
        <div id="card-text">{l.text.map((t) => <p key={t}>{t}</p>)}</div>
        <div id="card-actions">
          <button className="primary" onClick={() => onPano(l)}>Open 360° photo</button>
          <button className={got ? 'done' : 'accent'} disabled={got} onClick={() => onCheckIn(l.id)}>
            {got ? '★ Stamped' : `Check in · +${STAMP_XP} XP`}
          </button>
        </div>
        <div id="card-quiz">
          {l.quiz && got && <QuizPanel quiz={l.quiz} done={game.quiz.includes(l.id)} onCorrect={() => onCorrect(l.id)} />}
        </div>
      </div>
    </article>
  );
}
