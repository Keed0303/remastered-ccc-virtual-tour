import { useJoystick } from '../../hooks/useJoystick';
import type { WalkController } from '../../scene/WalkController';

export function TouchControls({ walk, canCheckIn, onCheckIn }: { walk: WalkController; canCheckIn: boolean; onCheckIn: () => void }) {
  const { base, knob, handlers } = useJoystick(walk.stick);
  const releaseJump = () => walk.keys.delete('Space');
  return (
    <>
      <div id="stick" ref={base} role="application" aria-label="Move your character" {...handlers}><i id="stick-knob" ref={knob} /></div>
      <div id="touch-actions">
        <button id="btn-checkin" hidden={!canCheckIn} onClick={onCheckIn}>Check in</button>
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
