import * as THREE from 'three';
import { Batch, C } from './Batch';
import { hipRoof, windows } from './props';
import { signPlane } from './textures';

export function buildNewBuilding(mat: THREE.Material, glowMat: THREE.Material) {
  const group = new THREE.Group();
  const b = new Batch(), g = new Batch();
  const x0 = 0, x1 = 44, z0 = 52, z1 = 90, bay = (z1 - z0) / 6;
  const ground = 4, up = 3.5, H = ground + up * 2 + 2.6;
  const cyan = '#2d9ad0', pier = '#1f73b5';
  b.box(x0, 0, z0, x1, H, z1, '#f4f3ef');
  // Cyan outline on the blank side and rear walls, which have no windows from the street.
  b.box(x0 - 0.45, H - 0.15, z0 - 0.45, x1 + 0.45, H + 0.5, z1 + 0.45, cyan);
  b.box(x0 - 0.1, 0, z1 - 0.4, x0 + 0.5, H, z1 + 0.15, cyan);

  // Street front: arcade with arched iron grilles.
  for (let i = 0; i < 6; i++) {
    const a = z0 + i * bay;
    b.box(x0 - 0.1, 0, a, x0, ground, a + bay, '#1f5e9c');
    for (let k = 0.75; k < bay - 0.6; k += 0.42) b.box(x0 - 0.24, 0.35, a + k, x0 - 0.12, 2.9, a + k + 0.08, '#0f2239');
    for (let y = 0.6; y < 2.9; y += 0.55) b.box(x0 - 0.26, y, a + 0.7, x0 - 0.12, y + 0.07, a + bay - 0.7, '#0f2239');
    // Cream spandrel stepped into an arch.
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const t0 = s / steps, t1 = (s + 1) / steps;
      const curve = Math.sin(((t0 + t1) / 2) * Math.PI);
      const y = 2.9 + curve * 0.58;
      b.box(x0 - 0.3, y, a + 0.6 + t0 * (bay - 1.2), x0 - 0.1, ground, a + 0.6 + t1 * (bay - 1.2), '#ded8c4');
    }
    b.box(x0 - 0.65, 0, a - 0.5, x0 + 0.05, ground, a + 0.5, pier);
    b.box(x0 - 0.8, 2.72, a - 0.62, x0 + 0.05, 2.92, a + 0.62, '#f0ecdf');
  }
  b.box(x0 - 0.65, 0, z1 - 0.5, x0 + 0.05, ground, z1 + 0.1, pier);
  // Metal awning over the ground floor.
  b.quad([x0 - 2.7, ground - 0.05, z1], [x0, ground + 0.5, z1], [x0, ground + 0.5, z0], [x0 - 2.7, ground - 0.05, z0], '#a3a8ab');
  b.quad([x0 - 2.7, ground - 0.05, z0], [x0, ground + 0.5, z0], [x0, ground + 0.5, z1], [x0 - 2.7, ground - 0.05, z1], '#7f8589');

  // Two window floors in a cyan grid, with blue hoods and caged air conditioners.
  for (let f = 0; f < 2; f++) {
    const y0 = ground + 0.5 + f * up;
    for (let i = 0; i < 6; i++) {
      const a = z0 + i * bay;
      const wz0 = a + 1.25, wz1 = a + bay - 1.15, wy0 = y0 + 0.8, wy1 = y0 + 2.6;
      b.box(x0 - 0.08, wy0 - 0.08, wz0 - 0.08, x0, wy1 + 0.08, wz1 + 0.08, C.dark);
      g.box(x0 - 0.12, wy0, wz0, x0 - 0.08, wy1, wz1, '#9cc3e0');
      for (let m = wz0 + 0.65; m < wz1; m += 0.65) b.box(x0 - 0.14, wy0, m, x0 - 0.08, wy1, m + 0.06, '#27415f');
      b.quad([x0 - 0.7, wy1 + 0.12, wz1 + 0.15], [x0, wy1 + 0.45, wz1 + 0.15], [x0, wy1 + 0.45, wz0 - 0.15], [x0 - 0.7, wy1 + 0.12, wz0 - 0.15], C.blue);
      if ((i + f) % 3 !== 1) {
        const ac = i % 2 ? wz1 - 1.25 : wz0 + 0.1;
        b.box(x0 - 0.62, wy1 - 0.72, ac, x0 - 0.08, wy1 - 0.08, ac + 1, '#d9dde0');
        if (f === 1) b.box(x0 - 0.62, wy0 - 0.08, ac, x0 - 0.08, wy0 + 0.52, ac + 1, '#c6cbcf');
      }
    }
  }
  // Cyan grid over the white wall.
  for (let i = 0; i <= 6; i++) b.box(x0 - 0.42, ground + 0.5, z0 + i * bay - 0.38, x0, i % 6 ? ground + 0.5 + up * 2 + 0.25 : H, z0 + i * bay + 0.38, cyan);
  b.box(x0 - 0.42, H - 0.3, z0 - 0.38, x0, H, z1 + 0.38, cyan);
  for (const y of [ground + 0.35, ground + 0.5 + up - 0.3, ground + 0.5 + up * 2 - 0.28]) b.box(x0 - 0.42, y, z0 - 0.38, x0, y + 0.55, z1 + 0.38, cyan);
  b.box(x0 - 0.1, ground + 0.5 + up * 2, z0, x0 - 0.02, H, z1, '#f7f6f1');

  // North side windows, facing the blue-roof building.
  for (let f = 0; f < 3; f++) windows(b, g, 'x', z0, x0 + 1.5, x1 - 1.5, 1 + f * 3.8, 2.1, 8, -1, C.dark);

  // Roof: grey blue ring, with a brown central roof seen on the satellite view.
  hipRoof(b, x0, z0, x1, z1, H + 0.5, H + 2.4, C.roofGrey, [12, 62, 32, 80]);
  hipRoof(b, 13, 63, 31, 79, H + 1.5, H + 4, C.brown);
  group.add(b.build(mat));
  group.add(g.build(glowMat, false));

  const sign = signPlane(32, 2.2, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#a93b36'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 54px Inter, Arial, sans-serif';
    x.letterSpacing = '6px';
    x.fillText('CITY COLLEGE OF CALAMBA', w / 2, h * 0.3);
    x.font = '700 38px Inter, Arial, sans-serif';
    x.letterSpacing = '3px';
    x.fillText('MAYOR JOAQUIN CHIPECO JR. BLDG.', w / 2, h * 0.74);
  }, 1400);
  sign.position.set(x0 - 0.16, H - 1.4, (z0 + z1) / 2); sign.rotation.y = -Math.PI / 2;
  group.add(sign);
  return group;
}
