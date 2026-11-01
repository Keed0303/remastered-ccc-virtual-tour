import * as THREE from 'three';
import { Batch, C } from './Batch';
import { addLobby } from './lobby';
import { block, hipRoof, palm, tree } from './props';
import { signPlane } from './textures';

export function buildOldBuilding(mat: THREE.Material, glowMat: THREE.Material) {
  const group = new THREE.Group();
  const b = new Batch(), g = new Batch();
  const H = 6.6;
  // Front wing with a stepped pavilion at each end, as seen from the plaza.
  // The middle of the front wing is hollow, because the lobby sits behind the entrance.
  block(b, g, -3, 10, -38, -24, H, { noE: true, roof: false });
  block(b, g, 38, 51, -38, -24, H, { noW: true, roof: false });
  block(b, g, 10, 21.7, -38, -37.6, H, { noS: true, noW: true, noE: true, roof: false });
  block(b, g, 26.3, 38, -38, -37.6, H, { noS: true, noW: true, noE: true, roof: false });
  b.box(21.7, 5.1, -38, 26.3, H, -37.6, C.white);
  hipRoof(b, -2, -37, 50, -25, H - 0.3, H + 1.5, C.roofDk);
  block(b, g, -4, 3, -39, -24, H + 0.7, { noS: true, noE: true, roof: false });
  block(b, g, 45, 52, -39, -24, H + 0.7, { noS: true, noW: true, roof: false });
  // Rear wings around the central hall and courtyard.
  block(b, g, -5, 10, -24, 6, H, { noN: true, noE: true, roof: false });
  hipRoof(b, -4, -23, 14, 5, H - 0.3, H + 1.5, C.roofDk);
  block(b, g, 10, 38, -5, 6, H, { noN: true, noW: true, noE: true, roof: false });
  block(b, g, 38, 38.3, -24, -5, H, { noN: true, noS: true, noW: true, roof: false });
  hipRoof(b, 15, -23, 37, 5, H - 0.3, H + 1.2, C.roofGrey);
  block(b, g, 40, 57, -24, -16, H, { noN: true, noW: true });
  block(b, g, 46, 57, -16, 6, H, { noN: true });
  block(b, g, 36, 46, -2, 6, H - 0.4, { noE: true, noW: true, noS: true });

  // Courtyard with the Gazebo, placed where the original floor plan puts it.
  b.box(36, 0, -24, 40, 0.12, -2, C.paver);
  b.box(40, 0, -16, 46, 0.12, -2, C.green2);
  b.box(36, 0, -16, 40, 0.14, -2, C.green2);
  b.cyl(40, 0.14, -9, 2.2, 0.2, C.paver, 8);
  for (const [dx, dz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) b.cyl(40 + dx, 0.3, -9 + dz, 0.1, 2.2, C.white, 6);
  b.cyl(40, 2.5, -9, 2.8, 1.1, C.brown, 8, 0.15);
  tree(b, 43.5, -13, 1.25, 2);
  palm(b, 41.5, -4.5, 0.8);

  // Portico: two white round columns at the front, and blue beams behind a white pediment.
  const px0 = 15.5, px1 = 32.5, front = -45.5, back = -38, c = 24;
  b.box(px0 - 0.4, 0, front - 0.2, px1 + 0.4, 1.5, back, '#b7b8b2');
  for (const x of [px0 + 0.8, px1 - 0.8]) {
    b.cyl(x, 1.5, front + 0.9, 0.95, 0.5, '#d4d5d0', 12, 0.8);
    b.cyl(x, 2, front + 0.9, 0.62, 4.1, '#e9e9e4', 16, 0.54);
    b.cyl(x, 6.1, front + 0.9, 0.62, 0.4, '#f4f4f0', 12, 0.86);
  }
  // Blue side beams and the recessed entrance.
  b.box(px0 + 1.4, 6, front + 0.5, px0 + 2.2, 6.6, back, C.blue);
  b.box(px1 - 2.2, 6, front + 0.5, px1 - 1.4, 6.6, back, C.blue);
  // Recessed entrance wall with a real opening through to the lobby.
  b.box(px0 + 1.6, 1.5, back - 1.6, c - 2.3, 6.3, back, '#e9e7df');
  b.box(c + 2.3, 1.5, back - 1.6, px1 - 1.6, 6.3, back, '#e9e7df');
  b.box(c - 2.3, 5.1, back - 1.6, c + 2.3, 6.3, back, '#e9e7df');
  b.box(c - 4.6, 1.5, back - 1.75, c - 2.3, 5.7, back - 1.6, C.blue);
  b.box(c + 2.3, 1.5, back - 1.75, c + 4.6, 5.7, back - 1.6, C.blue);
  b.box(c - 2.4, 5.1, back - 1.75, c + 2.4, 5.8, back - 1.6, C.blue);
  for (const x of [-6.8, -6.1, -5.5, 5.4, 6, 6.7]) b.box(c + x - 0.16, 1.5, back - 1.76, c + x + 0.16, 5.6, back - 1.6, '#d8d6cc');
  // Ceiling, front beam, and pediment.
  b.box(px0, 6.3, front, px1, 6.65, back, '#d8d4c3');
  b.box(px0 - 0.3, 6.65, front - 0.2, px1 + 0.3, 8.8, front + 0.2, C.white);
  b.box(px0, 6.65, front, px1, 8.7, back, C.white);
  const peak = 12.6;
  b.tri([px0 - 0.3, 8.8, front - 0.2], [px1 + 0.3, 8.8, front - 0.2], [c, peak, front - 0.2], C.white);
  b.tri([px0 - 0.3, 8.8, back], [c, peak, back], [px1 + 0.3, 8.8, back], C.white);
  const eave = 0.7;
  b.quad([px0 - 1.1, 8.55, front - eave], [c, peak + 0.42, front - eave], [c, peak + 0.42, back + 1], [px0 - 1.1, 8.55, back + 1], C.blueDk);
  b.quad([c, peak + 0.42, front - eave], [px1 + 1.1, 8.55, front - eave], [px1 + 1.1, 8.55, back + 1], [c, peak + 0.42, back + 1], C.blueDk);
  b.quad([px0 - 1.1, 8.55, front - eave], [px1 + 1.1, 8.55, front - eave], [c, peak + 0.42, front - eave], [c, peak + 0.42, front - eave], C.white);
  b.box(px0 - 1, 8.75, front - 0.28, px1 + 1, 9, front - 0.1, C.blueDk);

  // Wide terracotta stairs running down to Barreto St.
  const steps = 8;
  for (let i = 0; i < steps; i++) {
    const inset = i * 0.1;
    b.box(px0 - 1.3 + inset, 0, -50 + i * 0.58, px1 + 1.3 - inset, 1.5 * ((steps - i) / steps) * 0 + 1.5 * ((i + 1) / steps), front + 0.1, i % 2 ? C.step : '#b5664a');
  }
  // Blue wedge planters on both sides of the stairs, thick with shrubs and palms.
  const planter = (xInner: number, xOuter: number) => {
    const zf = -50, zb = -39, top = 1.5;
    b.quad([xInner, 0, zf], [xOuter, 0, zf], [xOuter, 0.25, zf], [xInner, top, zf], C.blue);
    b.quad([xOuter, 0, zf], [xInner, 0, zf], [xInner, top, zf], [xOuter, 0.25, zf], C.blue);
    b.quad([xInner, top, zf], [xOuter, 0.25, zf], [xOuter, 0.25, zb], [xInner, top, zb], C.green3);
    b.quad([xInner, 0, zf], [xInner, top, zf], [xInner, top, zb], [xInner, 0, zb], C.blue);
    b.quad([xInner, top, zb], [xInner, top, zf], [xInner, 0, zf], [xInner, 0, zb], C.blue);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = xInner + (xOuter - xInner) * t, y = top + (0.25 - top) * t;
      b.ball(x, y + 0.7, -47 + (i * 37 % 7), 0.95 + (i % 3) * 0.32, [C.green, '#7a9a3f', C.green3, '#9a5f46'][i % 4], 0);
    }
  };
  planter(px0 - 1.3, 3.5);
  planter(px1 + 1.3, 44.5);
  palm(b, 7.5, -41, 1); palm(b, 41, -41, 1.05); palm(b, 44, -44, 0.85); palm(b, 3.5, -43, 0.85);
  // Black lantern posts in front of the wings.
  for (const x of [1, 11.5, 36.5, 47]) {
    b.cyl(x, 0, -39.4, 0.07, 3.2, C.dark, 6);
    b.box(x - 0.17, 3.2, -39.57, x + 0.17, 3.75, -39.23, C.dark);
    g.box(x - 0.13, 3.25, -39.61, x + 0.13, 3.68, -39.19, '#ffe6a8');
  }

  group.add(b.build(mat));
  group.add(g.build(glowMat, false));
  addLobby(group, mat);

  const sign = signPlane(14, 1.4, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 66px Georgia, serif';
    x.fillStyle = '#8f8d82'; x.fillText('CITY COLLEGE OF CALAMBA', w / 2 + 3, h / 2 + 7);
    x.fillStyle = '#56544b'; x.fillText('CITY COLLEGE OF CALAMBA', w / 2, h / 2 + 3);
  });
  sign.position.set(c, 7.7, front - 0.24); sign.rotation.y = Math.PI;
  group.add(sign);

  const seal = signPlane(2.4, 2.4, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 6, 0, 7); x.fillStyle = '#d0a93a'; x.fill();
    x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 28, 0, 7); x.fillStyle = '#a83a30'; x.fill();
    x.beginPath(); x.arc(w / 2, h / 2, w / 4, 0, 7); x.fillStyle = '#f0ece0'; x.fill();
  }, 256);
  seal.position.set(c, 10.3, front - 0.24); seal.rotation.y = Math.PI;
  group.add(seal);
  return group;
}

// The CCC block under the large blue roof. Its heavy concrete band and pale blue
