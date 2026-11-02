import { useEffect, useState } from 'react';

export interface TipState { text: string; x: number; y: number; at: number }

// A short-lived room name beside the pointer.
export function RoomTip({ tip }: { tip: TipState | null }) {
  const [hiddenAt, setHiddenAt] = useState(0);
  useEffect(() => {
    if (!tip) return undefined;
    const timer = setTimeout(() => setHiddenAt(tip.at), 1800);
    return () => clearTimeout(timer);
  }, [tip]);
  const show = !!tip && tip.at !== hiddenAt;
  return <div id="tip" hidden={!show} style={tip ? { left: tip.x, top: tip.y } : undefined}>{tip?.text}</div>;
}
