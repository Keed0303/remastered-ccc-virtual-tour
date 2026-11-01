import { type CSSProperties, useEffect, useState } from 'react';

const COLORS = ['#1f62b8', '#f2c94c', '#d94a3d', '#58a05c', '#ffffff'];
const PIECES = 44;

function makePieces(): CSSProperties[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    left: `${50 + (Math.random() - 0.5) * 34}%`,
    background: COLORS[i % COLORS.length],
    '--x': `${(Math.random() - 0.5) * 420}px`,
    '--r': `${Math.random() * 720}deg`,
    animationDelay: `${Math.random() * 0.16}s`,
  } as CSSProperties));
}

// Plays one burst each time `burst` increases.
export function Confetti({ burst }: { burst: number }) {
  const [bursts, setBursts] = useState<{ id: number; pieces: CSSProperties[] }[]>([]);

  useEffect(() => {
    if (!burst || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    setBursts((list) => [...list, { id: burst, pieces: makePieces() }]);
    const timer = setTimeout(() => setBursts((list) => list.filter((b) => b.id !== burst)), 1700);
    return () => clearTimeout(timer);
  }, [burst]);

  return <>{bursts.map((b) => b.pieces.map((style, i) => <i key={`${b.id}-${i}`} className="confetti" style={style} />))}</>;
}
