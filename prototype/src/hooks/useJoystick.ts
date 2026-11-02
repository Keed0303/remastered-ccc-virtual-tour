import { type PointerEvent, useCallback, useEffect, useRef } from 'react';

const STICK_RADIUS = 52, STICK_DEADZONE = 0.14;

interface Stick { x: number; y: number; id: number | null }

// Writes straight to the scene's stick and the knob's style, so dragging never re-renders React.
export function useJoystick(stick: Stick) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLElement>(null);

  const move = useCallback((e: PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / STICK_RADIUS;
    let dy = (e.clientY - (r.top + r.height / 2)) / STICK_RADIUS;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    if (knob.current) knob.current.style.transform = `translate(${dx * STICK_RADIUS}px,${dy * STICK_RADIUS}px)`;
    const live = Math.hypot(dx, dy) > STICK_DEADZONE;
    stick.x = live ? dx : 0;
    stick.y = live ? -dy : 0;
  }, [stick]);

  const end = useCallback((e?: PointerEvent) => {
    if (e && e.pointerId !== stick.id) return;
    stick.x = 0; stick.y = 0; stick.id = null;
    if (knob.current) knob.current.style.transform = '';
  }, [stick]);

  useEffect(() => () => end(), [end]);

  const handlers = {
    onPointerDown: (e: PointerEvent) => {
      e.preventDefault();
      stick.id = e.pointerId;
      try { base.current!.setPointerCapture(e.pointerId); } catch { /* Movement still works without capture. */ }
      move(e);
    },
    onPointerMove: (e: PointerEvent) => { if (e.pointerId === stick.id) move(e); },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  };

  return { base, knob, handlers };
}
