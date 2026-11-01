import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FLOORS } from './data.js';

const C = {
  white: '#f3f4f2', cream: '#ece7db', blue: '#1f62b8', blueDk: '#174a8c', sky: '#4b8fd6', roof: '#3f6db5', roofDk: '#5a7192',
  roofGrey: '#7f8ea3', brown: '#6f4f3f', slab: '#e7e9ea', asphalt: '#8d9298', pale: '#dfe4e9', paleRoof: '#ccd3da',
  terra: '#b8795f', paver: '#ded7c8', paver2: '#c9c3b6', stone: '#a79c8b', green: '#6fa86a', green2: '#8cbf7c', green3: '#54935c',
  trunk: '#7a6248', dark: '#2a3442', step: '#c0704f', wood: '#a7835c', tile: '#f0ece2',
};

// Collects coloured geometry and merges it into one mesh, which keeps draw calls low.
export class Batch {
  constructor() { this.parts = []; }
  _add(g, color) {
    const geo = g.index ? g.toNonIndexed() : g;
    geo.deleteAttribute('uv');
    const col = new THREE.Color(color);
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    this.parts.push(geo);
    return geo;
  }
  box(x0, y0, z0, x1, y1, z1, color) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return this._add(g, color);
  }
  cyl(x, y, z, r, h, color, seg = 10, rTop = r) {
    const g = new THREE.CylinderGeometry(rTop, r, h, seg);
    g.translate(x, y + h / 2, z);
    return this._add(g, color);
  }
  ball(x, y, z, r, color, detail = 1, sy = 1) {
    const g = new THREE.IcosahedronGeometry(r, detail);
    g.scale(1, sy, 1);
    g.translate(x, y, z);
    return this._add(g, color);
  }
  quad(a, b, c, d, color) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    g.computeVertexNormals();
    return this._add(g, color);
  }
  tri(a, b, c, color) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
    g.computeVertexNormals();
    return this._add(g, color);
  }
  build(material, shadows = true) {
    const mesh = new THREE.Mesh(mergeGeometries(this.parts, false), material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    this.parts.forEach((p) => p.dispose());
    return mesh;
  }
}

// Sloped roof on a rectangle, optionally with a rectangular courtyard opening.
function hipRoof(b, x0, z0, x1, z1, y0, y1, color, hole) {
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
function windows(b, g, axis, fixed, from, to, y, h, count, side, frame = C.blueDk) {
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
function block(b, g, x0, x1, z0, z1, h, opts = {}) {
  const belt = (y0, y1, color, out = 0.05) => b.box(x0 - out, y0, z0 - out, x1 + out, y1, z1 + out, color);
  b.box(x0, 0, z0, x1, h, z1, C.white);
  belt(0, 0.55, '#d9d9d3');
  belt(3.45, 3.72, C.blue, 0.1);
  belt(h - 1.5, h - 1.12, C.blueDk, 0.12);
  belt(h - 0.12, h + 0.08, '#f8f8f4', 0.16);
  const w = Math.max(2, Math.round((x1 - x0) / 4.2)), d = Math.max(2, Math.round((z1 - z0) / 4.2));
  const face = (axis, fixed, a0, a1, n, side) => {
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

function tree(b, x, z, s = 1, tone = 0) {
  const greens = [C.green, C.green2, C.green3];
  b.cyl(x, 0, z, 0.3 * s, 3 * s, C.trunk, 6, 0.2 * s);
  b.ball(x, 4.6 * s, z, 2.4 * s, greens[tone % 3], 0);
  b.ball(x + 1.4 * s, 3.9 * s, z + 0.5 * s, 1.5 * s, greens[(tone + 1) % 3], 0);
  b.ball(x - 1.2 * s, 4.1 * s, z - 0.7 * s, 1.6 * s, greens[(tone + 2) % 3], 0);
}

function palm(b, x, z, s = 1) {
  b.cyl(x, 0, z, 0.22 * s, 5 * s, C.trunk, 6, 0.13 * s);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const dx = Math.cos(a), dz = Math.sin(a);
    const top = [x, 5 * s, z], tip = [x + dx * 2.8 * s, 4.1 * s, z + dz * 2.8 * s];
    const px = -dz * 0.55 * s, pz = dx * 0.55 * s;
    const mid = [x + dx * 1.4 * s, 5.2 * s, z + dz * 1.4 * s];
    b.tri(top, [mid[0] + px, mid[1], mid[2] + pz], tip, C.green3);
    b.tri(top, tip, [mid[0] - px, mid[1], mid[2] - pz], C.green);
  }
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function signPlane(w, h, draw, pxW = 1024) {
  const tex = canvasTex(pxW, Math.round((pxW * h) / w), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8 }));
  return m;
}

function buildOldBuilding(mat, glowMat) {
  const group = new THREE.Group();
  const b = new Batch(), g = new Batch();
  const H = 6.6;
  // Front wing with a stepped pavilion at each end, as seen from the plaza.
  block(b, g, -3, 51, -38, -24, H);
  block(b, g, -4, 3, -39, -24, H + 0.7, { noS: true, noE: true, roof: false });
  block(b, g, 45, 52, -39, -24, H + 0.7, { noS: true, noW: true, roof: false });
  // Rear wings around the central hall and courtyard.
  block(b, g, -5, 15, -24, 6, H, { noN: true, noE: true });
  block(b, g, 15, 36, -24, 6, H - 0.4, { noN: true, noW: true, noE: true, roofColor: C.roofGrey });
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
  palm(b, 37.8, -5, 0.8);

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
  b.box(px0 + 1.6, 1.5, back - 1.6, px1 - 1.6, 6.3, back, '#e9e7df');
  b.box(c - 4.6, 1.5, back - 1.75, c - 2.3, 5.7, back - 1.6, C.blue);
  b.box(c + 2.3, 1.5, back - 1.75, c + 4.6, 5.7, back - 1.6, C.blue);
  b.box(c - 2.4, 5.1, back - 1.75, c + 2.4, 5.8, back - 1.6, C.blue);
  b.box(c - 2.3, 1.5, back - 1.72, c + 2.3, 5.1, back - 1.6, C.dark);
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
  const planter = (xInner, xOuter) => {
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
// lower wall follow Street View of 221 S.V. Rizal St.
function buildBlueRoofBlock(mat, glowMat) {
  const group = new THREE.Group();
  const b = new Batch(), g = new Batch();
  const x0 = 0, x1 = 47, z0 = 6, z1 = 50;
  const concrete = '#b8b4a6', concreteDk = '#9d9a8d', paleBlue = '#8dbfe4';
  b.box(x0 + 0.8, 0, z0 + 0.8, x1 - 0.8, 6, z1 - 0.8, '#e6e1cf');
  b.box(x0 + 0.6, 0, z0 + 0.6, x1 - 0.6, 1.5, z1 - 0.6, paleBlue);
  // Deep overhanging concrete band around the top.
  b.box(x0 - 0.6, 5.4, z0 - 0.6, x1 + 0.6, 8.1, z1 + 0.6, concrete);
  b.box(x0 - 0.65, 6.7, z0 - 0.65, x1 + 0.65, 6.78, z1 + 0.65, concreteDk);
  // Concrete columns.
  for (let z = z0 + 0.5; z < z1; z += 5.4) b.box(x0 - 0.2, 0, z, x0 + 1, 5.4, z + 0.9, concrete);
  for (let x = x0 + 0.5; x < x1; x += 5.4) {
    b.box(x, 0, z1 - 1, x + 0.9, 5.4, z1 + 0.2, concrete);
    b.box(x, 0, z0 - 0.2, x + 0.9, 5.4, z0 + 1, concrete);
  }
  // Ribbon windows set back behind the columns.
  for (let z = z0 + 1.7; z < z1 - 3; z += 5.4) {
    b.box(x0 + 0.5, 2, z, x0 + 0.62, 4.1, z + 4.1, paleBlue);
    g.box(x0 + 0.42, 2.15, z + 0.2, x0 + 0.5, 3.95, z + 3.9, '#9cc3e0');
  }
  for (let x = x0 + 1.7; x < x1 - 3; x += 5.4) {
    b.box(x, 2, z1 - 0.62, x + 4.1, 4.1, z1 - 0.5, paleBlue);
    g.box(x + 0.2, 2.15, z1 - 0.5, x + 3.9, 3.95, z1 - 0.42, '#9cc3e0');
  }
  // Stairs and platform on the street side.
  b.box(x0 - 3.2, 0, 22, x0 + 0.7, 1.15, 34, '#c5c1b3');
  for (let i = 0; i < 4; i++) b.box(x0 - 3.2 - (4 - i) * 0.42, 0, 23.5, x0 - 3.2, 0.29 * (i + 1), 32.5, i % 2 ? '#aca89a' : '#bbb7a9');
  // Blue metal roof with the courtyard opening.
  hipRoof(b, x0, z0, x1, z1, 8.1, 14.2, C.roof, [15.5, 23, 28.5, 33]);
  for (const [a0, c0, a1, c1] of [[15.5, 23, 28.5, 23.2], [15.5, 32.8, 28.5, 33], [15.5, 23, 15.7, 33], [28.3, 23, 28.5, 33]]) b.box(a0, 8.8, c0, a1, 14.2, c1, '#e6e1cf');
  b.box(15.7, 8.2, 23.2, 28.3, 8.4, 32.8, C.green3);
  tree(b, 22, 28, 2, 1);
  group.add(b.build(mat));
  group.add(g.build(glowMat, false));
  // Graduation banners like those on the street front.
  for (const z of [11, 38]) {
    const banner = signPlane(7, 1.9, (x, w, h) => {
      x.fillStyle = '#2d5fa8'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ffffff'; x.font = '800 74px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('CONGRATULATIONS', w / 2, h / 2);
    }, 800);
    banner.position.set(x0 - 0.68, 7.1, z); banner.rotation.y = -Math.PI / 2;
    group.add(banner);
  }
  return group;
}

function buildNewBuilding(mat, glowMat) {
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

const ROOM_TONE = {
  class: '#e8eef6', lab: '#dcebf3', comlab: '#dae6f5', office: '#efe9dd', hall: '#f3e2c9', lobby: '#ecd9c4',
  library: '#ead9c7', closed: '#d0d3d6', garden: '#b6d9a8', void: '#c3dcc0',
};

function furnish(b, r) {
  const w = r.x1 - r.x0, d = r.z1 - r.z0;
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  if (r.k === 'class' || r.k === 'lab' || r.k === 'comlab') {
    const cols = Math.max(1, Math.floor(w / 2.6)), rows = Math.max(1, Math.floor(d / 2.6));
    const dark = r.k === 'comlab';
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = r.x0 + ((i + 0.5) * w) / cols, z = r.z0 + ((j + 0.5) * d) / rows;
        b.box(x - 0.65, 0.65, z - 0.35, x + 0.65, 0.78, z + 0.35, r.k === 'lab' ? '#ffffff' : C.wood);
        b.box(x - 0.08, 0, z - 0.08, x + 0.08, 0.65, z + 0.08, C.dark);
        if (dark) b.box(x - 0.35, 0.78, z - 0.25, x + 0.35, 1.25, z - 0.17, C.dark);
      }
    }
  } else if (r.k === 'library') {
    for (let x = r.x0 + 1.4; x < r.x1 - 1; x += 3) b.box(x, 0, r.z0 + 0.8, x + 0.8, 2, r.z1 - 0.8, C.brown);
  } else if (r.k === 'hall') {
    const rows = Math.floor(d / 1.6), cols = Math.floor(w / 1.5);
    if (w > 6 && d > 6) {
      b.box(r.x0 + 0.5, 0, r.z0 + 0.5, r.x1 - 0.5, 0.5, r.z0 + 3, C.brown);
      for (let i = 0; i < cols; i++) for (let j = 2; j < rows; j++) b.box(r.x0 + i * 1.5 + 0.5, 0, r.z0 + j * 1.6 + 0.3, r.x0 + i * 1.5 + 1.1, 0.5, r.z0 + j * 1.6 + 0.9, C.blue);
    } else {
      for (let i = 0; i < Math.floor(w / 3); i++) b.cyl(r.x0 + 1.5 + i * 3, 0, cz, 0.8, 0.75, C.wood, 8);
    }
  } else if (r.k === 'office' && w > 2 && d > 2) {
    b.box(cx - 1, 0, cz - 0.4, cx + 1, 0.8, cz + 0.4, C.wood);
  } else if (r.k === 'garden') {
    b.cyl(cx, 0, cz, Math.min(w, d) * 0.28, 0.25, C.paver, 8);
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) b.cyl(cx + dx, 0.25, cz + dz, 0.12, 2.6, C.white, 6);
    b.ball(cx, 3.2, cz, 2.4, C.brown, 0, 0.4);
    tree(b, r.x0 + 1.5, r.z0 + 2, 0.8, 0);
    tree(b, r.x1 - 1.5, r.z1 - 2, 0.8, 1);
  } else if (r.k === 'lobby') {
    b.box(cx - 1.6, 0, cz - 0.5, cx + 1.6, 1, cz + 0.5, C.blue);
  }
}

export function buildFloor(key, mat) {
  const fl = FLOORS[key], f = fl.foot;
  const group = new THREE.Group();
  group.name = key;
  const b = new Batch();
  b.box(f.x0 - 0.5, 0, f.z0 - 0.5, f.x1 + 0.5, 0.18, f.z1 + 0.5, C.slab);
  const wallH = 2.1, t = 0.2;
  const up = new Batch();
  for (const r of fl.rooms) {
    b.box(r.x0, 0.18, r.z0, r.x1, 0.24, r.z1, ROOM_TONE[r.k] || '#eee');
    if (r.k !== 'void' && r.k !== 'garden') {
      const wc = r.k === 'closed' ? '#a8adb3' : '#ffffff';
      up.box(r.x0, 0, r.z0, r.x1, wallH, r.z0 + t, wc);
      const mid = (r.x0 + r.x1) / 2;
      up.box(r.x0, 0, r.z1 - t, mid - 0.7, wallH, r.z1, wc);
      up.box(mid + 0.7, 0, r.z1 - t, r.x1, wallH, r.z1, wc);
      up.box(r.x0, 0, r.z0, r.x0 + t, wallH, r.z1, wc);
      up.box(r.x1 - t, 0, r.z0, r.x1, wallH, r.z1, wc);
      up.box(r.x0, wallH, r.z0, r.x1, wallH + 0.06, r.z0 + t, C.blue);
      up.box(r.x0, wallH, r.z1 - t, r.x1, wallH + 0.06, r.z1, C.blue);
      up.box(r.x0, wallH, r.z0, r.x0 + t, wallH + 0.06, r.z1, C.blue);
      up.box(r.x1 - t, wallH, r.z0, r.x1, wallH + 0.06, r.z1, C.blue);
    }
    if (r.k !== 'closed') furnish(up, r);
  }
  group.add(b.build(mat));
  const walls = up.build(mat);
  walls.position.y = 0.24;
  group.add(walls);

  // All room names share one transparent plane instead of many DOM labels.
  const W = f.x1 - f.x0, D = f.z1 - f.z0;
  const px = 2048, py = Math.round((px * D) / W);
  const tex = canvasTex(px, py, (x) => {
    x.clearRect(0, 0, px, py);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const r of fl.rooms) {
      const cx = ((r.x0 + r.x1) / 2 - f.x0) / W * px, cy = ((r.z0 + r.z1) / 2 - f.z0) / D * py;
      const rw = (r.x1 - r.x0) / W * px;
      const size = Math.max(19, Math.min(42, rw / Math.max(5, r.n.length * 0.62)));
      x.font = `700 ${size}px Inter, Arial, sans-serif`;
      const tw = x.measureText(r.n).width + 18;
      x.fillStyle = r.k === 'closed' ? 'rgba(90,96,104,.86)' : 'rgba(23,74,140,.9)';
      x.beginPath(); x.roundRect(cx - tw / 2, cy - size * 0.75, tw, size * 1.5, 8); x.fill();
      x.fillStyle = '#fff'; x.fillText(r.n, cx, cy + 1);
    }
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.set((f.x0 + f.x1) / 2, 3.1, (f.z0 + f.z1) / 2);
  plane.renderOrder = 5;
  group.add(plane);
  group.visible = false;
  return group;
}

function buildGround(mat, glowMat) {
  const group = new THREE.Group();
  const b = new Batch();
  const glow = new Batch();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshStandardMaterial({ color: '#d7dcdf', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true;
  group.add(ground);

  // Streets
  const road = (x0, z0, x1, z1) => b.box(x0, 0, z0, x1, 0.02, z1, C.asphalt);
  road(-17, -240, -7, 220);
  road(-120, -58, 160, -50);
  road(59, -58, 67, 220);
  road(-120, 94, 160, 101);
  for (let z = -230; z < 215; z += 9) b.box(-12.15, 0.02, z, -11.85, 0.03, z + 4.5, '#eef0f1');
  for (let x = -115; x < 155; x += 9) if (x < -18 || x > -6) { b.box(x, 0.02, -54.15, x + 4.5, 0.03, -53.85, '#eef0f1'); b.box(x, 0.02, 97.35, x + 4.5, 0.03, 97.65, '#eef0f1'); }
  for (let z = -40; z < 90; z += 9) b.box(62.85, 0.02, z, 63.15, 0.03, z + 4.5, '#eef0f1');
  // Campus pavement
  b.box(-7, 0, -50, 59, 0.05, 94, '#d3d0c9');

  // Rizal Plaza, from the entry arches down to the brick edge along Barreto St.
  const px0 = 18, px1 = 50;
  const stone = '#7f8084', cream = '#e4dfd2';
  b.box(px0, 0, -125, px1, 0.08, -58, stone);
  for (let z = -119; z < -60; z += 7.4) {
    for (const [a, c] of [[px0 + 1.8, px0 + 7], [px0 + 7.5, px0 + 12.6], [px1 - 12.6, px1 - 7.5], [px1 - 7, px1 - 1.8]]) {
      if (z > -84 && z < -66 && a > px0 + 7 && c < px1 - 7) continue;
      b.box(a, 0.08, z, c, 0.1, z + 6.4, cream);
    }
  }
  b.box(px0, 0.08, -60.5, px1, 0.11, -58, '#a85c47');
  // Green edge between the plaza and the street.
  b.box(px0 + 1, 0.11, -60.2, px0 + 10, 0.5, -58.4, C.green3);
  b.box(px1 - 10, 0.11, -60.2, px1 - 1, 0.5, -58.4, C.green3);
  for (const x of [px0 + 0.7, px1 - 0.7]) b.box(x - 0.5, 0, -60, x + 0.5, 1.8, -59, '#e6e0d0');
  // Terracotta and grey rings around the monument.
  b.cyl(34, 0.08, -74, 14.5, 0.05, '#c98a6f', 32);
  b.cyl(34, 0.09, -74, 10.6, 0.05, '#6f7277', 32);
  b.cyl(34, 0.1, -74, 8.8, 0.05, '#c98a6f', 32);
  b.cyl(34, 0.1, -105, 3.8, 0.05, '#a85c47', 4);
  b.cyl(34, 0.14, -74, 5.6, 0.4, C.sky, 24);
  b.cyl(34, 0.3, -74, 5.25, 0.38, '#b98d5e', 24);

  // Rizal Monument: a bronze figure above a dark pedestal.
  b.box(32.6, 0.7, -75.4, 35.4, 3.2, -72.6, '#3f3f3d');
  const bronze = '#2f2e2c';
  b.cyl(33.5, 3.2, -74, 0.34, 2.4, bronze, 8, 0.3);
  b.cyl(34.5, 3.2, -74, 0.34, 2.4, bronze, 8, 0.3);
  b.cyl(34, 5.4, -74, 0.85, 2.6, bronze, 10, 0.62);
  b.cyl(33.06, 5.9, -74, 0.19, 2, bronze, 6, 0.24);
  b.cyl(34.94, 5.9, -74, 0.19, 2, bronze, 6, 0.24);
  b.ball(34, 8.5, -74, 0.5, bronze, 1);
  // Floral wreaths on stands around the base.
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2, r = 2.7 + (i % 3) * 0.75;
    b.ball(34 + Math.cos(a) * r, 1.4 + (i % 4) * 0.42, -74 + Math.sin(a) * r, 0.52, ['#d94a3d', '#f2c94c', '#f8f4e8', '#58a05c', '#e77f3b'][i % 5], 0);
  }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.15 + (i / 6) * Math.PI * 1.3 + Math.PI * 0.0;
    const x = 34 + Math.cos(a) * 4.5, z = -74 + Math.sin(a) * 4.5;
    b.box(x - 0.1, 0.7, z - 0.03, x + 0.1, 2.9, z + 0.03, '#ffffff');
  }
  // Flagpole on a round blue base.
  b.cyl(34, 0.1, -105, 1.1, 0.9, C.sky, 12);
  b.cyl(34, 1, -105, 0.13, 17, '#e5e7ea', 8, 0.07);
  b.ball(34, 18.1, -105, 0.2, '#f2c94c', 1);

  // Entry arches: dark metal posts and curved ribs above stone and blue pillars.
  const metal = '#27333f';
  for (const [px, dir] of [[23, 1], [45, -1]]) {
    b.box(px - 1.5, 0.08, -121.5, px + 1.5, 0.45, -118.5, C.sky);
    b.box(px - 1.2, 0.45, -121.2, px + 1.2, 2.5, -118.8, '#a48c66');
    b.box(px - 1.3, 2.5, -121.3, px + 1.3, 2.8, -118.7, C.sky);
    for (const dz of [-0.55, 0.55]) b.box(px - 0.13, 2.8, -120 + dz - 0.13, px + 0.13, 8.3, -120 + dz + 0.13, metal);
    b.box(px - 1, 7.4, -120.75, px + 1, 7.65, -119.25, metal);
    const span = 10.2;
    for (const off of [-0.55, 0.55]) {
      for (let s = 0; s < 14; s++) {
        const t = s / 14, t2 = (s + 1) / 14;
        const x1 = px + dir * t * span, x2 = px + dir * t2 * span;
        const y1 = 8.2 + Math.sin(t * Math.PI * 0.55) * 2.6, y2 = 8.2 + Math.sin(t2 * Math.PI * 0.55) * 2.6;
        const seg = new THREE.BoxGeometry(Math.hypot(x2 - x1, y2 - y1) + 0.05, 0.13, 0.13);
        seg.rotateZ(Math.atan2(y2 - y1, x2 - x1));
        seg.translate((x1 + x2) / 2, (y1 + y2) / 2, -120 + off);
        b._add(seg, metal);
      }
    }
    for (let s = 1; s < 7; s++) {
      const t = s / 7, x = px + dir * t * span, y = 8.25 + Math.sin(t * Math.PI * 0.55) * 2.6;
      b.box(x - 0.06, y, -121.1, x + 0.06, y + 0.1, -118.9, metal);
    }
  }

  // Dark iron fence along both plaza sides, on a low stone base.
  for (const x of [px0 - 0.2, px1 + 0.2]) {
    b.box(x - 0.15, 0, -116, x + 0.15, 0.45, -62, '#b8b1a1');
    for (let z = -116; z < -62; z += 1.2) b.box(x - 0.03, 0.45, z, x + 0.03, 1.4, z + 0.06, '#232a33');
    b.box(x - 0.05, 1.32, -116, x + 0.05, 1.4, -62, '#232a33');
  }

  // Benches, bins and lamp posts down both sides of the plaza.
  for (let z = -120; z < -55; z += 13) {
    for (const [x, s] of [[px0 + 1.2, 1], [px1 - 1.2, -1]]) {
      b.box(x - 0.45, 0.45, z - 1.4, x + 0.45, 0.62, z + 1.4, C.sky);
      b.box(x - 0.35, 0, z - 1.2, x + 0.35, 0.45, z - 1, C.dark);
      b.box(x - 0.35, 0, z + 1, x + 0.35, 0.45, z + 1.2, C.dark);
      b.cyl(x + s * 0.2, 0, z + 5, 0.42, 1.2, C.sky, 10);
      b.cyl(x + s * 0.6, 0, z - 4.5, 0.09, 5, '#47525f', 6);
      glow.ball(x + s * 0.6, 5.2, z - 4.5, 0.34, '#fff1c2', 1);
    }
  }
  [[12, -112, 2], [11, -96, 0], [13, -82, 1], [11, -68, 2], [55, -112, 1], [56, -66, 1], [22, -92, 0], [46, -90, 1], [46, -66, 2], [22, -68, 1]].forEach(([x, z, t]) => tree(b, x, z, 1.9, t));
  [[3, -64], [-1, -82], [68, -76], [72, -62]].forEach(([x, z], i) => tree(b, x, z, 1.2, i));
  [[-4.3, 56], [-6.2, 10], [-6.2, 30]].forEach(([x, z], i) => tree(b, x, z, 0.75, i));

  // Neighbouring blocks stay pale so that the campus stands out.
  const hood = (x0, z0, x1, z1, h, tone = 0) => {
    b.box(x0, 0, z0, x1, h, z1, C.pale);
    hipRoof(b, x0, z0, x1, z1, h, h + 1.8, ['#c9b5ab', C.paleRoof, '#c0c9cf', '#cfbfb2'][tone % 4]);
  };
  // Blocks between the default camera and the campus are kept low so they don't hide it.
  const west = [[-44, -40, -22, -28, 3.5], [-40, -26, -20, -14, 3.5], [-50, -12, -22, 6, 4.5], [-42, 8, -20, 24, 5], [-52, 26, -24, 44, 7], [-42, 46, -21, 62, 6], [-54, 64, -22, 84, 8], [-40, 102, -18, 122, 7]];
  west.forEach(([a, c, d, e, h], i) => hood(a, c, d, e, h, i));
  const north = [[-2, -98, 10, -62, 3.5], [58, -130, 78, -96, 8], [84, -92, 104, -60, 7]];
  north.forEach(([a, c, d, e, h], i) => hood(a, c, d, e, h, i + 1));
  const east = [[71, -40, 94, -18, 7], [72, -14, 96, 8, 9], [72, 12, 92, 34, 6], [71, 38, 100, 60, 8], [72, 64, 96, 88, 7]];
  east.forEach(([a, c, d, e, h], i) => hood(a, c, d, e, h, i + 2));
  // These sit inside the fitted floor plan footprint, so floor views hide them.
  const stripB = new Batch();
  for (const [x0, z0, x1, z1, h] of [[49.5, 8, 57.5, 48, 10], [46, 52, 57.5, 88, 9]]) {
    stripB.box(x0, 0, z0, x1, h, z1, '#eef0ef');
    stripB.box(x0 - 0.1, 3, z0 - 0.1, x1 + 0.1, 3.5, z1 + 0.1, '#5da3d4');
    hipRoof(stripB, x0, z0, x1, z1, h, h + 1.5, '#aab8c4');
  }
  // Landmark neighbours: the milk tea building east of the plaza and the cream two-storey
  // building across S.V. Rizal St at the end of Barreto St.
  b.box(53, 0, -92, 66, 9, -74, '#cdd0ce');
  for (const y of [3.4, 6.4]) b.box(52.2, y, -92, 53, y + 1, -74, '#e4e6e4');
  hipRoof(b, 53, -92, 66, -74, 9, 10.2, '#aeb6bb');
  b.box(-44, 0, -70, -20, 7, -50, '#e8e1cc');
  for (const y of [0, 3.5]) {
    for (let z = -69; z < -51; z += 3.6) {
      b.box(-20, y + 0.5, z, -19.85, y + 3, z + 2.6, y ? '#8ca1ad' : '#5e6a72');
      b.box(-19.8, y, z - 0.45, -19.3, y + 3.4, z - 0.15, '#f4f0e2');
    }
    if (y) b.box(-20, y - 0.1, -70, -18.8, y + 0.15, -50, '#f4f0e2');
  }
  hipRoof(b, -44, -70, -20, -50, 7, 8.8, '#b6a79b');
  // Motor tricycles waiting along S.V. Rizal St.
  const trike = (x, z) => {
    b.box(x - 0.55, 0.32, z - 1.1, x + 0.55, 1.05, z + 1.1, '#6f3a35');
    b.box(x - 0.62, 1.82, z - 1.2, x + 0.62, 1.92, z + 1.2, '#22262c');
    for (const dz of [-1, 1]) b.box(x - 0.56, 1.05, z + dz - 0.04, x - 0.5, 1.82, z + dz + 0.04, '#22262c');
    for (const dz of [-1, 1]) b.box(x + 0.5, 1.05, z + dz - 0.04, x + 0.56, 1.82, z + dz + 0.04, '#22262c');
    b.cyl(x - 0.72, 0, z - 0.8, 0.3, 0.14, '#16191d', 8);
    b.cyl(x + 0.72, 0, z + 0.8, 0.3, 0.14, '#16191d', 8);
  };
  for (let z = 54; z < 88; z += 3.1) trike(-3.6, z);
  for (let z = -40; z < -14; z += 3.4) trike(-6.1, z);
  // Small shops against the blank south wall of the New Building.
  [['#a33d3a', 5], ['#e1b63c', 11], ['#9c6b4c', 17], ['#d9d0a8', 24]].forEach(([color, x]) => {
    b.box(x, 0, 90.4, x + 5.4, 2.7, 93.3, color);
    b.quad([x - 0.2, 2.65, 94], [x + 5.6, 2.65, 94], [x + 5.6, 3.1, 90.4], [x - 0.2, 3.1, 90.4], '#7c8388');
  });
  const strip = stripB.build(mat);
  strip.name = 'eastStrip';
  group.add(strip);
  const south = [[-4, 103, 26, 125, 7], [30, 104, 54, 128, 9], [70, 104, 96, 126, 6]];
  south.forEach(([a, c, d, e, h], i) => hood(a, c, d, e, h, i));

  group.add(b.build(mat));
  group.add(glow.build(glowMat, false));
  return group;
}

export function createFlag() {
  const tex = canvasTex(180, 90, (x, w, h) => {
    x.fillStyle = '#0038a8'; x.fillRect(0, 0, w, h / 2);
    x.fillStyle = '#ce1126'; x.fillRect(0, h / 2, w, h / 2);
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * 0.42, h / 2); x.lineTo(0, h); x.fill();
    x.fillStyle = '#fcd116'; x.beginPath(); x.arc(w * 0.14, h / 2, h * 0.12, 0, 7); x.fill();
  });
  const geo = new THREE.PlaneGeometry(4.6, 2.3, 14, 4);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }));
  mesh.position.set(34 + 2.3, 16.3, -105);
  mesh.castShadow = true;
  const base = geo.attributes.position.array.slice();
  mesh.userData.wave = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3] + 2.3;
      p.setZ(i, Math.sin(x * 1.8 + t * 4) * 0.12 * x);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return mesh;
}

// Blocky student figures with Minecraft-like proportions, in the CCC uniform.
// One pixel is 1/16 of the head-and-body scale. Feet sit at y = 0 and the figure faces +z.
const PX = 0.0525;
export const FIGURE = { hipY: 0.64, hipX: 0.105, shoulderY: 1.26, shoulderX: 0.315 };
const UNIFORM = { white: '#f7f7f4', navy: '#16233f', crest: '#2a7fc0', crestLight: '#7fd0ee', laurel: '#4f8a55', shoe: '#20242c' };
const FACE = { eye: '#20242c', white: '#f4f4f0', mouth: '#b9735c' };

function pixels(b, rows, colors, x0, yTop, z, dir = 1) {
  rows.forEach((row, r) => {
    [...row].forEach((c, i) => {
      const color = colors[c];
      if (!color) return;
      const x = x0 + i * PX, y = yTop - r * PX;
      b.box(x, y - PX, z, x + PX, y, z + dir * 0.006, color);
    });
  });
}

function merged(batch) {
  const geo = mergeGeometries(batch.parts, false);
  batch.parts.forEach((p) => p.dispose());
  return geo;
}

export function figureBody({ skin, hair, longHair = false, backpack = false }) {
  const b = new Batch();
  // Torso: blouse, with navy trousers starting at the waistband.
  b.box(-0.21, 0.64, -0.105, 0.21, 1.28, 0.105, UNIFORM.white);
  const colors = { N: UNIFORM.navy, S: skin, B: UNIFORM.crest, L: UNIFORM.crestLight, G: UNIFORM.laurel };
  // Open collar and front placket with navy piping, with the crest on the wearer's left chest.
  pixels(b, [
    '.NSSSSN.',
    '..NSSN..',
    '...NN...',
    '...N....',
    '...N.BB.',
    '...N.LB.',
    '...N.BB.',
    '...NG..G',
    '...N....',
    '...N....',
    '...N....',
    'NNNNNNNN',
  ], colors, -0.21, 1.28, 0.105);
  // Collar piping and waistband on the back.
  b.box(-0.21, 1.2275, -0.111, 0.21, 1.28, -0.105, UNIFORM.navy);
  b.box(-0.21, 0.64, -0.111, 0.21, 0.6925, -0.105, UNIFORM.navy);
  // Head.
  b.box(-0.21, 1.28, -0.21, 0.21, 1.7, 0.21, skin);
  pixels(b, [
    'HHHHHHHH',
    'HHHHHHHH',
    '........',
    '.WE..EW.',
    '........',
    '...MM...',
  ].map((row) => row), { H: hair, W: FACE.white, E: FACE.eye, M: FACE.mouth }, -0.21, 1.7, 0.21);
  // Hair: a slightly larger cap so it reads as a separate block.
  b.box(-0.22, 1.6, -0.22, 0.22, 1.72, 0.22, hair);
  b.box(-0.22, longHair ? 0.98 : 1.32, -0.22, 0.22, 1.72, -0.15, hair);
  b.box(-0.22, longHair ? 1.08 : 1.46, -0.22, -0.2, 1.72, 0.1, hair);
  b.box(0.2, longHair ? 1.08 : 1.46, -0.22, 0.22, 1.72, 0.1, hair);
  if (backpack) {
    b.box(-0.17, 0.78, -0.21, 0.17, 1.2, -0.105, '#1f62b8');
    b.box(-0.13, 0.82, -0.235, 0.13, 1.02, -0.21, '#174a8c');
  }
  return merged(b);
}

// Arm with its pivot at the shoulder: white sleeve, navy cuff, then bare arm.
export function figureArm(skin) {
  const b = new Batch();
  b.box(-0.105, -0.25, -0.105, 0.105, 0.02, 0.105, UNIFORM.white);
  b.box(-0.11, -0.31, -0.11, 0.11, -0.25, 0.11, UNIFORM.navy);
  b.box(-0.095, -0.62, -0.095, 0.095, -0.31, 0.095, skin);
  return merged(b);
}

// Leg with its pivot at the hip: navy trousers and dark shoes.
export function figureLeg() {
  const b = new Batch();
  b.box(-0.105, -0.54, -0.105, 0.105, 0, 0.105, UNIFORM.navy);
  b.box(-0.11, -0.64, -0.12, 0.11, -0.54, 0.14, UNIFORM.shoe);
  return merged(b);
}

export function createAvatar() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true });
  const part = (geo, x, y) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  const skin = '#e0ac84';
  const figure = new THREE.Group();
  part(figureBody({ skin, hair: '#2a2118', backpack: true }), 0, 0);
  g.userData.armL = part(figureArm(skin), FIGURE.shoulderX, FIGURE.shoulderY);
  g.userData.armR = part(figureArm(skin), -FIGURE.shoulderX, FIGURE.shoulderY);
  const leg = figureLeg();
  g.userData.legL = part(leg, FIGURE.hipX, FIGURE.hipY);
  g.userData.legR = part(leg, -FIGURE.hipX, FIGURE.hipY);
  g.scale.setScalar(1.15);
  // Marker ring that makes the player easy to find from above.
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.78, 30), new THREE.MeshBasicMaterial({ color: '#2f7be0', transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);
  return g;
}

export function buildWorld(scene) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.25, emissive: new THREE.Color('#ffd58a'), emissiveIntensity: 0 });
  const lampMat = new THREE.MeshStandardMaterial({ vertexColors: true, emissive: new THREE.Color('#ffdd99'), emissiveIntensity: 0, roughness: 0.4 });
  const ground = buildGround(mat, lampMat);
  const oldB = buildOldBuilding(mat, glassMat);
  const newB = buildNewBuilding(mat, glassMat);
  const hall = buildBlueRoofBlock(mat, glassMat);
  const floors = {};
  for (const key of Object.keys(FLOORS)) { floors[key] = buildFloor(key, mat); scene.add(floors[key]); }
  scene.add(ground, oldB, newB, hall);
  const flag = createFlag();
  scene.add(flag);
  return { mat, glassMat, lampMat, ground, oldB, newB, hall, floors, flag };
}
