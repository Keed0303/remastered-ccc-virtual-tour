import { useJoystick } from '../../hooks/useJoystick';
import type { WalkController } from '../../scene/WalkController';
import type { SeatState } from '../../types/scene';

export function TouchControls({ walk, canCheckIn, onCheckIn, seat }: { walk: WalkController; canCheckIn: boolean; onCheckIn: () => void; seat: SeatState }) {
  const { base, knob, handlers } = useJoystick(walk.stick);
  const releaseJump = () => walk.keys.delete('Space');
  return (
    <>
      <div id="stick" ref={base} role="application" aria-label="Move your character" {...handlers}><i id="stick-knob" ref={knob} /></div>
      <div id="touch-actions">
        <button id="btn-checkin" hidden={!canCheckIn} onClick={onCheckIn}>Check in</button>
        <button id="btn-sit" hidden={!seat.canSit && !seat.seated} onClick={() => walk.useSeat()}>{seat.seated ? 'Stand' : 'Sit'}</button>
        <button
          id="btn-jump"
          onPointerDown={(e) => { e.preventDefault(); walk.keys.add('Space'); }}
          onPointerUp={releaseJump}
          onPointerLeave={releaseJump}
          onPointerCancel={releaseJump}
        >Jump</button>
      </div>
    </>
  );
}
