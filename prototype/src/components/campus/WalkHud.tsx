import type { CampusScene } from '../../scene/CampusScene';
import type { LocationDef } from '../../types/campus';
import type { GameState } from '../../types/game';
import type { SeatState } from '../../types/scene';
import type { MicState } from '../../types/voice';
import { MicButton } from './MicButton';
import { TouchControls } from './TouchControls';

interface WalkHudProps { scene: CampusScene; nearby: LocationDef | null; game: GameState; onCheckIn: () => void; canTalk: boolean; micState: MicState; seat: SeatState }

export function WalkHud({ scene, nearby, game, onCheckIn, canTalk, micState, seat }: WalkHudProps) {
  const stamped = !!nearby && game.stamps.includes(nearby.id);
  const touch = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const action = touch ? 'Tap Check in' : 'Press E to check in';
  return (
    <div id="walk-ui">
      <div className="keys"><b>Click</b> then move the mouse to look · <b>W A S D</b> to walk · <b>Shift</b> to run · <b>Space</b> to jump · <b>E</b> to check in or sit · {canTalk && <><b>M</b> for mic · </>}<b>Esc</b> to free the mouse</div>
      <div id="prompt" hidden={!nearby && !seat.seated}>
        {seat.seated ? (touch ? 'Tap Stand to get up' : 'Press E to stand up') : nearby && (stamped ? `${nearby.name} · Stamped ★` : `${nearby.name} · ${action}`)}
      </div>
      <TouchControls walk={scene.walk} canCheckIn={!!nearby && !stamped} onCheckIn={onCheckIn} seat={seat} />
      <button id="walk-exit" className="primary" onClick={() => scene.stopWalk()}>Exit walking</button>
      {canTalk && <MicButton state={micState} onToggle={() => void scene.online.voice.toggleMic()} />}
    </div>
  );
}
