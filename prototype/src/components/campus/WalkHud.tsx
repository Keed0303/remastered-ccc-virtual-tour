import type { CampusScene } from '../../scene/CampusScene';
import type { LocationDef } from '../../types/campus';
import type { GameState } from '../../types/game';
import { TouchControls } from './TouchControls';

interface WalkHudProps { scene: CampusScene; nearby: LocationDef | null; game: GameState; onCheckIn: () => void }

export function WalkHud({ scene, nearby, game, onCheckIn }: WalkHudProps) {
  const stamped = !!nearby && game.stamps.includes(nearby.id);
  const action = matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'Tap Check in' : 'Press E to check in';
  return (
    <div id="walk-ui">
      <div className="keys"><b>Click</b> then move the mouse to look · <b>W A S D</b> to walk · <b>Shift</b> to run · <b>Space</b> to jump · <b>E</b> to check in · <b>Esc</b> to free the mouse</div>
      <div id="prompt" hidden={!nearby}>{nearby && (stamped ? `${nearby.name} · Stamped ★` : `${nearby.name} · ${action}`)}</div>
      <TouchControls walk={scene.walk} canCheckIn={!!nearby && !stamped} onCheckIn={onCheckIn} />
      <button id="walk-exit" className="primary" onClick={() => scene.stopWalk()}>Exit walking</button>
    </div>
  );
}
