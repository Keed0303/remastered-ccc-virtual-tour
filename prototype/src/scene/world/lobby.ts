import * as THREE from 'three';
import { Batch, C } from './Batch';
import { canvasTex, signPlane } from './textures';

// Walk-in lobby of the Old Building, modelled from the original tour's lobby panorama.
export function addLobby(group: THREE.Group, mat: THREE.Material) {
  const b = new Batch();
  const glow = new Batch();
  const F = 1.5, TOP = 5.95;
  const X0 = 10, X1 = 38, N = -37.6, S = -20, END = -5;
  const white = '#f5f3ec', frame = '#1f3f9c', red = '#8d2f25', redDk = '#6f2219', marble = ['#d5c8b0', '#c9b99d', '#ddd1bb', '#c2b196', '#cfc1a8'];

  // Marble floor, laid as individual tiles with small colour changes.
  b.box(X0, 0, -38, X1, F, END, marble[0]);
  let row = 0;
  for (let z = -38; z < END; z += 1, row++) {
    for (let x = X0 + (row % 2 ? -0.7 : 0); x < X1; x += 1.4) {
      const a = Math.max(x, X0), c = Math.min(x + 1.36, X1);
      if (c <= a) continue;
      const tone = marble[Math.abs(Math.floor(x * 7 + row * 13)) % marble.length];
      b.quad([a, F + 0.004, Math.min(z + 0.96, END)], [c, F + 0.004, Math.min(z + 0.96, END)], [c, F + 0.004, z], [a, F + 0.004, z], tone);
    }
  }

  // Outer walls and ceiling.
  b.box(X0 - 0.3, F, -38, X0, TOP, END, white);
  b.box(X1, F, -38, X1 + 0.3, TOP, END, white);
  b.box(X0, TOP, -38, X1, TOP + 0.08, END, '#efe9dc');
  b.box(X0, F, N, 21.7, TOP, N + 0.2, white);
  b.box(26.3, F, N, X1, TOP, N + 0.2, white);
  b.box(21.7, 5.1, N, 26.3, TOP, N + 0.2, white);
  // Cove around the ceiling.
  b.box(X0, TOP - 0.45, -37.4, X0 + 0.9, TOP, S, '#ebe5d6');
  b.box(X1 - 0.9, TOP - 0.45, -37.4, X1, TOP, S, '#ebe5d6');
  b.box(X0, TOP - 0.45, N + 0.2, X1, TOP, N + 1, '#ebe5d6');

  // South wall, broken by the two corridors and the stage alcove.
  const southParts = [[X0, 13.5], [16.5, 21], [27, 31.5], [34.5, X1]];
  for (const [a, c] of southParts) b.box(a, F, S, c, TOP, S + 0.3, white);
  b.box(13.5, 4.4, S, 16.5, TOP, S + 0.3, white);
  b.box(31.5, 4.4, S, 34.5, TOP, S + 0.3, white);

  // Blue frame grid on the upper walls.
  const gridX = (x: number, side: number, z0: number, z1: number) => {
    for (const y of [3.45, 4.85]) b.box(x, y - 0.05, z0, x + side * 0.04, y + 0.05, z1, frame);
    for (let z = z0; z <= z1 + 0.01; z += 1.3) b.box(x, 3.45, z - 0.04, x + side * 0.04, 4.85, z + 0.04, frame);
  };
  const gridZ = (z: number, side: number, x0: number, x1: number) => {
    for (const y of [3.45, 4.85]) b.box(x0, y - 0.05, z, x1, y + 0.05, z + side * 0.04, frame);
    for (let x = x0; x <= x1 + 0.01; x += 1.3) b.box(x - 0.04, 3.45, z, x + 0.04, 4.85, z + side * 0.04, frame);
  };
  gridX(X0, 1, -37.3, -20.2);
  gridX(X1, -1, -37.3, -20.2);
  gridZ(N + 0.2, 1, X0, 21.4);
  gridZ(N + 0.2, 1, 26.6, X1);
  for (const [a, c] of southParts) gridZ(S, -1, a, c);
  for (const [z0, z1] of [[-37.3, -30], [-29, -21]]) {
    for (const [x, side] of [[X0, 1], [X1, -1]]) {
      // Dark arched band and paired lights along the side walls.
      const steps = 16;
      for (let s = 0; s < steps; s++) {
        const a = z0 + ((z1 - z0) * s) / steps, c = z0 + ((z1 - z0) * (s + 1)) / steps;
        const y = 5.02 + Math.sin(((s + 0.5) / steps) * Math.PI) * 0.42;
        b.box(x, y, a, x + side * 0.07, y + 0.08, c, '#26303d');
      }
      glow.ball(x + side * 0.12, 5.48, (z0 + z1) / 2, 0.07, '#ffffff', 0);
    }
  }

  // Red wood panels on the south wall, with vertical grooves.
  const panel = (a: number, c: number, top = 3.36) => {
    b.box(a, F, S - 0.04, c, top, S, red);
    for (let x = a + 0.22; x < c; x += 0.22) b.box(x, F, S - 0.05, x + 0.03, top, S - 0.04, redDk);
  };
  panel(10.6, 13);
  panel(16.9, 18.8);
  panel(29.2, 31.1);
  panel(35, 37.4);

  // Wide raised platform in two steps, facing the entrance.
  b.box(15, F, -26, 33, 1.67, -20, '#d9cdb6');
  b.box(16, 1.67, -25, 32, 1.84, -20, '#e0d5c0');

  // Marble stairs up to the Roman Lazaro Hall door.
  for (let i = 0; i < 6; i++) b.box(21.3, 1.84, -22.2 + i * 0.5, 26.7, 1.84 + 0.17 * (i + 1), -15.5, i % 2 ? '#d4c8b1' : '#e2d7c2');
  // Plinths with iron lamp posts on each side.
  for (const [a, c] of [[19.6, 21.3], [26.7, 28.4]]) {
    b.box(a, 1.84, -22.2, c, 3.1, -19.7, white);
    const x = (a + c) / 2;
    b.cyl(x, 3.1, -21, 0.2, 0.3, '#23272c', 8, 0.12);
    b.cyl(x, 3.4, -21, 0.075, 1.6, '#23272c', 8, 0.055);
    b.cyl(x, 5, -21, 0.16, 0.16, '#23272c', 8, 0.08);
    glow.ball(x, 5.26, -21, 0.11, '#fff5d6', 0);
  }
  // Stainless railings drawn as short stepped sections.
  for (const x of [21.4, 26.6]) {
    for (let i = 0; i < 6; i++) {
      const y = 1.84 + 0.17 * (i + 1) + 0.92;
      b.box(x - 0.03, y, -22.2 + i * 0.5, x + 0.03, y + 0.05, -21.7 + i * 0.5, '#c4c8cc');
      b.box(x - 0.025, y - 0.92, -22 + i * 0.5, x + 0.025, y, -21.95 + i * 0.5, '#c4c8cc');
    }
  }

  // Stage alcove and the white door portal.
  b.box(21, 1.84, -20, 21.3, TOP, -15.5, white);
  b.box(26.7, 1.84, -20, 27, TOP, -15.5, white);
  b.box(21, 2.86, -15.5, 27, TOP, -15.2, red);
  for (let x = 21.2; x < 27; x += 0.22) b.box(x, 4.95, -15.52, x + 0.03, TOP, -15.5, redDk);
  b.box(22, 2.86, -15.6, 26, 5.05, -15.5, '#f8f7f1');
  b.box(21.82, 5.05, -15.7, 26.18, 5.16, -15.45, frame);
  b.box(22.55, 2.86, -15.66, 25.45, 4.45, -15.6, '#14181f');
  for (let x = 22.7; x < 25.4; x += 0.36) b.box(x, 2.9, -15.7, x + 0.05, 4.42, -15.66, '#3b4552');
  for (const y of [3.3, 3.8, 4.2]) b.box(22.55, y, -15.7, 25.45, y + 0.05, -15.66, '#3b4552');
  // Dark plaques beside the stairs.
  for (const x of [18.95, 28.5]) b.box(x, 2.3, S - 0.08, x + 0.55, 3, S - 0.04, '#2b2622');

  // Corridors on both sides, running deeper into the building.
  const corridor = (x0: number, x1: number) => {
    b.box(x0 - 0.2, F, S, x0, 4.4, END, white);
    b.box(x1, F, S, x1 + 0.2, 4.4, END, white);
    b.box(x0, 4.4, S, x1, 4.5, END, '#f4f2ea');
    b.box(x0, F, END - 1, x1, 4.4, END - 0.8, '#e6dfc6');
    b.box(x0 + 1, F, END - 1.03, x1 - 1, 3.8, END - 1, '#6d5140');
    for (const [x, side] of [[x0, 1], [x1, -1]]) {
      gridX(x, side, S + 0.3, END - 1);
      b.box(x, F, S + 0.3, x + side * 0.03, 1.8, END - 1, frame);
    }
    for (let z = S + 1.6; z < END - 1; z += 3) glow.box(x0 + 0.8, 4.37, z, x1 - 0.8, 4.4, z + 1.1, '#ffffff');
  };
  corridor(13.5, 16.5);
  corridor(31.5, 34.5);

  // Reception desk beside the lit crest.
  b.box(10.6, F, -24.4, 16.2, 2.45, -23.5, C.blue);
  b.box(10.5, 2.45, -24.5, 16.3, 2.72, -23.4, '#f5f4ee');
  b.box(10.45, 2.72, -24.55, 16.35, 2.78, -23.35, '#1b1d22');
  b.box(10.4, F, -23.5, 11.3, 2.45, -21, C.blue);
  b.box(10.3, 2.45, -23.5, 11.4, 2.72, -21, '#f5f4ee');
  b.box(10.25, 2.72, -23.5, 11.45, 2.78, -20.95, '#1b1d22');

  // Waiting chairs and the portable air cooler.
  const chair = (x: number, z: number) => {
    b.box(x - 0.24, 2, z - 0.24, x + 0.24, 2.06, z + 0.24, '#1d2026');
    b.box(x - 0.24, 2.06, z + 0.2, x + 0.24, 2.6, z + 0.25, '#1d2026');
    for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) b.box(x + dx - 0.02, F, z + dz - 0.02, x + dx + 0.02, 2, z + dz + 0.02, '#3a3f47');
  };
  for (let i = 0; i < 4; i++) { chair(33.9 + i * 0.85, -24.6); chair(33.9 + i * 0.85, -22.8); }
  b.box(31.9, 1.8, -22.5, 32.9, 3.2, -21.6, '#b4b9bd');
  for (let y = 1.95; y < 3.1; y += 0.14) b.box(31.88, y, -22.52, 32.92, y + 0.05, -22.5, '#71777d');
  b.box(32.3, F, -22.2, 32.5, 1.8, -21.9, '#8c9196');
  b.box(31.8, F, -22.6, 33, 1.58, -21.5, '#9aa0a5');

  // Open entrance doors, blue with a lattice pattern.
  for (const [a, c] of [[21.7, 21.84], [26.16, 26.3]]) {
    b.box(a, F, -37.4, c, 5.1, -35.1, '#1b3f8f');
    for (let z = -37.2; z < -35.2; z += 0.36) {
      for (const dx of [-0.01, 0.15]) b.box(a + dx, F + 0.2, z, a + dx + 0.02, 4.9, z + 0.05, '#7da2d8');
    }
  }

  // Ceiling lights, and a rosette of thin ribs like the real ceiling.
  for (let z = -35; z < -21; z += 3.4) {
    for (const x of [12.5, 16.5, 20.5, 24, 27.5, 31.5, 35.5]) glow.cyl(x, TOP - 0.02, z, 0.3, 0.02, '#ffffff', 12);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rib = new THREE.BoxGeometry(5.2, 0.015, 0.05);
    rib.translate(3.1, 0, 0);
    rib.rotateY(a);
    rib.translate(24, TOP - 0.01, -29);
    b.add(rib, '#7b8591');
  }
  b.cyl(24, TOP - 0.03, -29, 0.45, 0.03, '#5d6978', 16);

  group.add(b.build(mat));
  group.add(glow.build(new THREE.MeshBasicMaterial({ vertexColors: true }), false));

  // Warm room lights. These have no shadows, to keep the scene fast.
  for (const [x, y, z, power] of [[24, 5.2, -31, 24], [15, 5, -26, 13], [33, 5, -26, 13], [24, 4.8, -18, 7], [15, 4, -12, 7], [33, 4, -12, 7]]) {
    const light = new THREE.PointLight('#fff1dc', power, 26, 1.8);
    light.position.set(x, y, z);
    group.add(light);
  }

  const lazaroSign = signPlane(3.4, 0.5, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#a57f2e'; x.font = '700 62px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('ROMAN LAZARO HALL', w / 2, h / 2 + 3);
  });
  lazaroSign.position.set(24, 4.74, -15.62); lazaroSign.rotation.y = Math.PI;
  group.add(lazaroSign);

  // Glowing crest above reception. A simplified shield, not the official logo artwork.
  const crestTex = canvasTex(256, 280, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.shadowColor = '#a8e4ff'; x.shadowBlur = 22;
    x.beginPath(); x.moveTo(36, 34); x.lineTo(w - 36, 34); x.lineTo(w - 36, 150);
    x.quadraticCurveTo(w - 50, 226, w / 2, 250); x.quadraticCurveTo(50, 226, 36, 150); x.closePath();
    x.fillStyle = '#ffffff'; x.fill();
    x.shadowBlur = 0;
    x.beginPath(); x.moveTo(56, 54); x.lineTo(w - 56, 54); x.lineTo(w - 56, 146);
    x.quadraticCurveTo(w - 66, 208, w / 2, 228); x.quadraticCurveTo(66, 208, 56, 146); x.closePath();
    x.fillStyle = '#2a7fc0'; x.fill();
  });
  const crest = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.32), new THREE.MeshBasicMaterial({ map: crestTex, transparent: true }));
  crest.position.set(11.8, 2.7, S - 0.07); crest.rotation.y = Math.PI;
  group.add(crest);
}
