import { type Batch, C, type Point } from './Batch';

interface BlockOptions { noN?: boolean; noS?: boolean; noE?: boolean; noW?: boolean; roof?: boolean; roofColor?: string }

// Sloped roof on a rectangle, optionally with a rectangular courtyard opening.
export function hipRoof(b: Batch, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, color: string, hole?: number[]) {
  const o = 0.8;
  const [X0, Z0, X1, Z1] = [x0 - o, z0 - o, x1 + o, z1 + o];
  const inset = Math.min(x1 - x0, z1 - z0) * 0.32;
  const [a0, c0, a1, c1] = hole || [x0 + inset, z0 + inset, x1 - inset, z1 - inset];
  b.quad([X0, y0, Z1], [X1, y0, Z1], [a1, y1, c1], [a0, y1, c1], color);
  b.quad([X1, y0, Z1], [X1, y0, Z0], [a1, y1, c0], [a1, y1, c1], color);
  b.quad([X1, y0, Z0], [X0, y0, Z0], [a0, y1, c0], [a1, y1, c0], color);
  b.quad([X0, y0, Z0], [X0, y0, Z1], [a0, y1, c1], [a0, y1, c0], color);
  if (!hole) b.quad([a0, y1, c1], [a1, y1, c1], [a1, y1, c0], [a0, y1, c0], color);
  b.box(X0, y0 - 0.25, Z0, X1, y0, Z1, C.white);
}

// Row of framed windows along a wall. side is +1 or -1 for the outward direction.
export function windows(b: Batch, g: Batch, axis: 'x' | 'z', fixed: number, from: number, to: number, y: number, h: number, count: number, side: number, frame = C.blueDk) {
  const step = (to - from) / count;
  for (let i = 0; i < count; i++) {
    const a = from + step * (i + 0.18), c = from + step * (i + 0.82);
    if (axis === 'x') {
      b.box(a - 0.12, y - 0.12, fixed, c + 0.12, y + h + 0.12, fixed + side * 0.1, frame);
      g.box(a, y, fixed + side * 0.1, c, y + h, fixed + side * 0.14, '#9cc3e0');
    } else {
      b.box(fixed, y - 0.12, a - 0.12, fixed + side * 0.1, y + h + 0.12, c + 0.12, frame);
      g.box(fixed + side * 0.1, y, a, fixed + side * 0.14, y + h, c, '#9cc3e0');
    }
  }
}

// Low wing with a flat parapet hiding the roof, and the two blue bands seen on the Old Building.
export function block(b: Batch, g: Batch, x0: number, x1: number, z0: number, z1: number, h: number, opts: BlockOptions = {}) {
  const belt = (y0: number, y1: number, color: string, out = 0.05) => b.box(x0 - out, y0, z0 - out, x1 + out, y1, z1 + out, color);
  b.box(x0, 0, z0, x1, h, z1, C.white);
  belt(0, 0.55, '#d9d9d3');
  belt(3.45, 3.72, C.blue, 0.1);
  belt(h - 1.5, h - 1.12, C.blueDk, 0.12);
  belt(h - 0.12, h + 0.08, '#f8f8f4', 0.16);
  const w = Math.max(2, Math.round((x1 - x0) / 4.2)), d = Math.max(2, Math.round((z1 - z0) / 4.2));
  const face = (axis: 'x' | 'z', fixed: number, a0: number, a1: number, n: number, side: number) => {
    const step = (a1 - a0) / n;
    for (let i = 0; i < n; i++) {
      const p0 = a0 + step * (i + 0.04), p1 = a0 + step * (i + 0.96);
      if (axis === 'x') b.box(p0, 0.55, fixed, p1, 3.45, fixed + side * 0.07, C.blue);
      else b.box(fixed, 0.55, p0, fixed + side * 0.07, 3.45, p1, C.blue);
    }
    windows(b, g, axis, fixed + side * 0.07, a0, a1, 0.95, 2.3, n, side, '#f0f0ec');
  };
  if (!opts.noN) face('x', z0, x0, x1, w, -1);
  if (!opts.noS) face('x', z1, x0, x1, w, 1);
  if (!opts.noW) face('z', x0, z0, z1, d, -1);
  if (!opts.noE) face('z', x1, z0, z1, d, 1);
  if (opts.roof !== false) hipRoof(b, x0 + 1, z0 + 1, x1 - 1, z1 - 1, h - 0.3, h + 1.5, opts.roofColor || C.roofDk);
}

export function tree(b: Batch, x: number, z: number, s = 1, tone = 0) {
  const greens = [C.green, C.green2, C.green3];
  b.cyl(x, 0, z, 0.3 * s, 3 * s, C.trunk, 6, 0.2 * s);
  b.ball(x, 4.6 * s, z, 2.4 * s, greens[tone % 3], 0);
  b.ball(x + 1.4 * s, 3.9 * s, z + 0.5 * s, 1.5 * s, greens[(tone + 1) % 3], 0);
  b.ball(x - 1.2 * s, 4.1 * s, z - 0.7 * s, 1.6 * s, greens[(tone + 2) % 3], 0);
}

export function palm(b: Batch, x: number, z: number, s = 1) {
  b.cyl(x, 0, z, 0.22 * s, 5 * s, C.trunk, 6, 0.13 * s);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    const top: Point = [x, 5 * s, z], tip: Point = [x + dx * 2.8 * s, 4.1 * s, z + dz * 2.8 * s];
    const px = -dz * 0.55 * s, pz = dx * 0.55 * s;
    const mid = [x + dx * 1.4 * s, 5.2 * s, z + dz * 1.4 * s];
    b.tri(top, [mid[0] + px, mid[1], mid[2] + pz], tip, C.green3);
    b.tri(top, tip, [mid[0] - px, mid[1], mid[2] - pz], C.green);
  }
}
