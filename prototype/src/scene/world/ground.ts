import * as THREE from 'three';
import { BENCHES, PLAZA } from '../../utils/seats';
import { ARCH_Z, EAST_BLOCKS, EAST_OF_PLAZA, FLAGPOLE, LOT_HOUSES, MONUMENT, SHOPS, STALLS, TREES } from '../../utils/physics';
import { BLOCK, BROSAS, CAMPUS_LAND, STREETS, SV_RIZAL, SV_RIZAL_NORTH, distanceToPath, offsetPath, pathLength, pointAlong, type PathPoint } from '../../utils/streets';
import { Batch, C } from './Batch';
import { hipRoof, tree } from './props';
import { canvasTex } from './textures';

// A flat strip of the given width that follows a path.
function ribbon(b: Batch, path: PathPoint[], width: number, y: number, color: string) {
  const right = offsetPath(path, width / 2), left = offsetPath(path, -width / 2);
  for (let i = 1; i < path.length; i++) {
    // Going down the path, right then left keeps the face pointing up.
    b.quad([right[i - 1][0], y, right[i - 1][1]], [right[i][0], y, right[i][1]], [left[i][0], y, left[i][1]], [left[i - 1][0], y, left[i - 1][1]], color);
  }
}

// A flat area with any outline.
function flat(b: Batch, outline: PathPoint[], y: number, color: string) {
  const shape = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  b.add(g, color);
}

export function buildGround(mat: THREE.Material, glowMat: THREE.Material) {
  const group = new THREE.Group();
  const b = new Batch();
  const glow = new Batch();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshStandardMaterial({ color: '#d7dcdf', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true;
  group.add(ground);

  // Streets
  for (const { path, width } of STREETS) ribbon(b, path, width, 0.02, C.asphalt);
  for (const { name, path } of STREETS) {
    for (let d = 8; d < pathLength(path) - 4.5; d += 9) {
      const from = pointAlong(path, d), to = pointAlong(path, d + 4.5);
      // No lane marks where one street crosses another.
      if (name !== SV_RIZAL.name && name !== SV_RIZAL_NORTH.name && [SV_RIZAL, SV_RIZAL_NORTH].some((s) => distanceToPath(from.x, from.z, s.path) < s.width / 2 + 1.5)) continue;
      if (name === BROSAS.name && from.x > 68) continue;
      ribbon(b, [[from.x, from.z], [to.x, to.z]], 0.3, 0.03, '#eef0f1');
    }
  }
  // Neighbouring lots on the block, then CCC's own pavement.
  flat(b, BLOCK, 0.03, '#cdd1c9');
  flat(b, CAMPUS_LAND, 0.05, '#d3d0c9');

  // Rizal Plaza in its original position, with the design it had by January 2026.
  // See devnote/2026-11-03-plaza-2026.md.
  const { x0: px0, x1: px1, z0: pz0, z1: pz1, axis } = PLAZA;
  const brick = '#a5584a', whiteStone = '#ece9e0', iron = '#232a33', timber = '#6b3f2a', rafter = '#b1623a', wood = '#8a5a3c';
  b.box(px0, 0, pz0, px1, 0.08, pz1, '#97938d');
  // Red brick panels down the middle, and the brick sidewalks along both streets.
  for (const z of [-114, -104, -94, -84]) b.box(axis - 9, 0.08, z, axis + 9, 0.1, z + 8, '#a86a58');
  b.box(px0 - 2, 0, -61, px1 + 4, 0.1, -58, brick);
  b.box(px0 - 2, 0, pz0, px0, 0.1, -61, brick);

  // Low white planter wall along S.V. Rizal St, and the two entry planters on Barreto St.
  const planter = (x0: number, z0: number, x1: number, z1: number) => {
    b.box(x0, 0, z0, x1, 0.65, z1, whiteStone);
    b.box(x0 + 0.15, 0.65, z0 + 0.15, x1 - 0.15, 0.8, z1 - 0.15, C.green3);
  };
  planter(px0 - 1.4, pz0 + 2, px0 - 0.2, -65);
  planter(px0, -65, axis - 6, -61);
  planter(axis + 6, -65, px1, -61);
  for (const dx of [-13, -9.5, 9.5, 13]) b.ball(axis + dx, 1.15, -63, 0.62, C.green, 1, 0.9);
  // The carved tree stump at the corner.
  b.cyl(px0 - 0.4, 0.1, -62, 0.5, 3, '#6b5845', 7, 0.28);
  b.cyl(px0 - 0.1, 2.2, -62, 0.25, 1.3, '#5d4c3c', 6, 0.1);

  // Iron fences with brick pillars and white caps. The east side stands on a grey stone wall.
  const fencePillar = (x: number, z: number) => {
    b.box(x - 0.55, 0, z - 0.55, x + 0.55, 0.5, z + 0.55, whiteStone);
    b.box(x - 0.45, 0.5, z - 0.45, x + 0.45, 2.1, z + 0.45, brick);
    b.box(x - 0.55, 2.1, z - 0.55, x + 0.55, 2.35, z + 0.55, whiteStone);
    b.ball(x, 2.6, z, 0.22, '#f3f0e4', 0);
  };
  for (const [x, base] of [[px0 - 0.1, 0.3], [px1 + 0.1, 1.05]] as const) {
    if (base > 0.5) b.box(x - 0.22, 0, pz0 + 2, x + 0.22, base, -61, '#6f6f6b');
    for (let z = pz0 + 2; z < -61; z += 0.6) b.box(x - 0.03, base, z, x + 0.03, 1.95, z + 0.05, iron);
    b.box(x - 0.05, 1.88, pz0 + 2, x + 0.05, 1.95, -61, iron);
    for (let z = -64; z > pz0; z -= 11) fencePillar(x, z);
  }

  // Timber pergolas over long tables, on both sides.
  for (const [a, c] of [[px0 + 0.4, px0 + 6.4], [px1 - 6.4, px1 - 0.4]]) {
    for (let z = -113; z <= -76; z += 6.1) {
      for (const x of [a + 0.2, c - 0.2]) b.box(x - 0.12, 0, z - 0.12, x + 0.12, 3.1, z + 0.12, timber);
    }
    for (const x of [a + 0.2, c - 0.2]) b.box(x - 0.14, 3.1, -113.5, x + 0.14, 3.35, -76, timber);
    for (let z = -113.5; z < -76; z += 1.1) b.box(a - 0.5, 3.35, z, c + 0.5, 3.5, z + 0.22, rafter);
  }
  for (const { x, z, side: s } of BENCHES) {
    // The seat bench faces the middle of the plaza, with the table behind it.
    b.box(x - 0.3, 0.45, z - 1.4, x + 0.3, 0.62, z + 1.4, wood);
    const tableX = x - s * 1.1;
    b.box(tableX - 0.5, 0.75, z - 2.5, tableX + 0.5, 0.86, z + 2.5, wood);
    b.box(x - s * 2.2 - 0.25, 0.42, z - 2.2, x - s * 2.2 + 0.25, 0.54, z + 2.2, wood);
    for (const dz of [-2, 2]) {
      b.box(tableX - 0.08, 0, z + dz - 0.08, tableX + 0.08, 0.75, z + dz + 0.08, C.dark);
      b.box(x - 0.2, 0, z + dz * 0.5 - 0.06, x + 0.2, 0.45, z + dz * 0.5 + 0.06, C.dark);
    }
  }
  // Black posts with three lanterns.
  for (const [dx, z] of [[-8, -74], [8, -74], [-8, -90], [8, -90], [-8, -106], [8, -106]]) {
    const x = axis + dx;
    b.cyl(x, 0.08, z, 0.09, 4, '#1f2328', 6);
    for (const off of [-0.32, 0, 0.32]) {
      b.box(x + off - 0.15, 3.85, z - 0.15, x + off + 0.15, 3.9, z + 0.15, '#1f2328');
      glow.ball(x + off, 4.15, z, 0.2, '#fff1c2', 1);
    }
  }

  // Rizal Monument: a bronze figure on a plain stone pedestal, inside a low chain.
  const [mx, mz] = MONUMENT;
  b.box(mx - 1.3, 0.08, mz - 1.3, mx + 1.3, 1.5, mz + 1.3, '#8f8b80');
  const bronze = '#2f2e2c', foot = 1.5;
  b.cyl(mx - 0.5, foot, mz, 0.34, 2.4, bronze, 8, 0.3);
  b.cyl(mx + 0.5, foot, mz, 0.34, 2.4, bronze, 8, 0.3);
  b.cyl(mx, foot + 2.2, mz, 0.85, 2.6, bronze, 10, 0.62);
  b.cyl(mx - 0.94, foot + 2.7, mz, 0.19, 2, bronze, 6, 0.24);
  b.cyl(mx + 0.94, foot + 2.7, mz, 0.19, 2, bronze, 6, 0.24);
  b.ball(mx, foot + 5.3, mz, 0.5, bronze, 1);
  for (const [dx, dz] of [[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]) b.cyl(mx + dx, 0.08, mz + dz, 0.07, 0.9, '#2b2f35', 6);
  for (const dz of [-2.2, 2.2]) b.box(mx - 2.2, 0.72, mz + dz - 0.02, mx + 2.2, 0.76, mz + dz + 0.02, '#2b2f35');
  for (const dx of [-2.2, 2.2]) b.box(mx + dx - 0.02, 0.72, mz - 2.2, mx + dx + 0.02, 0.76, mz + 2.2, '#2b2f35');

  // Brick arch with white stone edges at the north end.
  const [aw, ah, ar] = [4.4, 7, 3];
  const face = new THREE.Shape([new THREE.Vector2(-aw, 0), new THREE.Vector2(-ar, 0), new THREE.Vector2(-ar, ah - ar - 0.6)]);
  face.absarc(0, ah - ar - 0.6, ar, Math.PI, 0, true);
  face.lineTo(ar, 0); face.lineTo(aw, 0); face.lineTo(aw, ah); face.lineTo(-aw, ah); face.closePath();
  const archGeo = new THREE.ExtrudeGeometry(face, { depth: 1.5, bevelEnabled: false, curveSegments: 14 });
  archGeo.translate(axis, 0.08, ARCH_Z - 0.75);
  b.add(archGeo, brick);
  for (const x of [axis - aw - 0.5, axis + aw + 0.5]) {
    b.box(x - 0.6, 0, ARCH_Z - 0.95, x + 0.6, ah + 0.5, ARCH_Z + 0.95, whiteStone);
    b.box(x - 0.8, ah + 0.5, ARCH_Z - 1.15, x + 0.8, ah + 0.8, ARCH_Z + 1.15, '#d9d5c8');
  }
  b.box(axis - aw, ah + 0.08, ARCH_Z - 0.9, axis + aw, ah + 0.4, ARCH_Z + 0.9, whiteStone);

  // Flagpole just behind the arch.
  const [fx, fz] = FLAGPOLE;
  b.cyl(fx, 0.08, fz, 0.6, 0.5, whiteStone, 10);
  b.cyl(fx, 0.5, fz, 0.13, 17, '#e5e7ea', 8, 0.07);
  b.ball(fx, 17.6, fz, 0.2, '#f2c94c', 1);

  // The small blue kiosk with a red roof, on the Barreto St corner.
  b.box(px1 + 1.2, 0.1, -63, px1 + 3.8, 1.2, -60.4, '#4f86b8');
  b.box(px1 + 1.25, 1.2, -62.95, px1 + 3.75, 2.3, -60.45, '#7fa6c4');
  b.quad([px1 + 0.8, 2.5, -60], [px1 + 4.2, 2.5, -60], [px1 + 4.2, 2.9, -63.4], [px1 + 0.8, 2.9, -63.4], '#b5493f');

  TREES.forEach(([x, z, s, t]) => tree(b, x, z, s, t));

  // The shop row and market across S.V. Rizal St from the plaza, going north from the stalls.
  (['#3f7fb5', '#c9503f', '#2f7d55'] as const).forEach((wall, i) => {
    const sign = ['#c9c7bd', '#e7a13a', '#9c3a33'][i];
    const [x0, z0, x1, z1] = SHOPS[i];
    b.box(x0, 0, z0, x1, 3, z1, wall);
    b.box(x1, 2.3, z0, x1 + 0.15, 3.3, z1, sign);
    b.quad([x1 + 1.3, 2.3, z1], [x1 + 1.3, 2.3, z0], [x1, 3, z0], [x1, 3, z1], '#8a8f94');
  });
  (['#d2554a', '#e0b23f', '#4f86b8'] as const).forEach((color, i) => {
    const z = STALLS[i][1];
    b.box(2, 0, z, 5.5, 2, z + 3, '#b9b2a4');
    b.quad([6.4, 2.1, z + 3.2], [6.4, 2.1, z - 0.2], [1.8, 2.8, z - 0.2], [1.8, 2.8, z + 3.2], color);
  });
  b.box(6.8, 0.4, -74.5, 8.3, 1, -72.5, '#2f9a55');
  b.cyl(7.3, 0, -60, 0.05, 2.3, '#3a3f45', 5);
  b.cyl(7.3, 2.2, -60, 1.3, 0.5, '#d9604f', 10, 0.05);

  // Neighbouring blocks stay pale so that the campus stands out.
  const hood = (x0: number, z0: number, x1: number, z1: number, h: number, tone = 0) => {
    b.box(x0, 0, z0, x1, h, z1, C.pale);
    hipRoof(b, x0, z0, x1, z1, h, h + 1.8, ['#c9b5ab', C.paleRoof, '#c0c9cf', '#cfbfb2'][tone % 4]);
  };
  // Blocks between the default camera and the campus are kept low so they don't hide it.
  const west = [[-44, -40, -22, -28, 3.5], [-40, -26, -20, -14, 3.5], [-50, -12, -22, 6, 4.5], [-42, 8, -20, 24, 5], [-52, 26, -24, 44, 7], [-42, 46, -21, 62, 6], [-54, 64, -22, 84, 8], [-40, 102, -18, 122, 7]];
  west.forEach(([a, c, d, e, h], i) => hood(a, c, d, e, h, i));
  hood(84, -92, 104, -60, 7, 2);
  // Buildings east of the plaza, and the church north of Burgos St with its stone walls and red roof.
  EAST_OF_PLAZA.forEach(([a, c, d, e], i) => hood(a, c, d, e, 8, i + 1));
  b.box(20, 0, -180, 72, 9, -146, '#a79c8b');
  hipRoof(b, 20, -180, 72, -146, 9, 14, '#b5493f');
  EAST_BLOCKS.forEach(([a, c, d, e], i) => hood(a, c, d, e, [7, 9, 6, 8, 7][i], i + 2));
  // Private houses at the south-east corner of the block.
  LOT_HOUSES.forEach(([a, c, d, e], i) => hood(a, c, d, e, 6, i));
  // These sit inside the fitted floor plan footprint, so floor views hide them.
  const stripB = new Batch();
  for (const [x0, z0, x1, z1, h] of [[49.5, 8, 57.5, 48, 10], [46, 52, 57.5, 88, 9]]) {
    stripB.box(x0, 0, z0, x1, h, z1, '#eef0ef');
    stripB.box(x0 - 0.1, 3, z0 - 0.1, x1 + 0.1, 3.5, z1 + 0.1, '#5da3d4');
    hipRoof(stripB, x0, z0, x1, z1, h, h + 1.5, '#aab8c4');
  }
  // Landmark neighbours: the milk tea building east of the plaza and the two-storey
  // building across S.V. Rizal St at the end of Barreto St.
  b.box(53, 0, -92, 66, 9, -74, '#cdd0ce');
  for (const y of [3.4, 6.4]) b.box(52.2, y, -92, 53, y + 1, -74, '#e4e6e4');
  hipRoof(b, 53, -92, 66, -74, 9, 10.2, '#aeb6bb');
  b.box(-39, 0, -70, -15, 7, -50, '#e8e1cc');
  for (const y of [0, 3.5]) {
    for (let z = -69; z < -51; z += 3.6) {
      b.box(-15, y + 0.5, z, -14.85, y + 3, z + 2.6, y ? '#8ca1ad' : '#5e6a72');
      b.box(-14.8, y, z - 0.45, -14.3, y + 3.4, z - 0.15, '#f4f0e2');
    }
    if (y) b.box(-15, y - 0.1, -70, -13.8, y + 0.15, -50, '#f4f0e2');
  }
  hipRoof(b, -39, -70, -15, -50, 7, 8.8, '#b6a79b');
  // Motor tricycles waiting along S.V. Rizal St.
  const trike = (x: number, z: number) => {
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
  ([['#a33d3a', 5], ['#e1b63c', 11], ['#9c6b4c', 17], ['#d9d0a8', 24]] as [string, number][]).forEach(([color, x]) => {
    b.box(x, 0, 90.4, x + 5.4, 2.7, 93.3, color);
    b.quad([x - 0.2, 2.65, 94], [x + 5.6, 2.65, 94], [x + 5.6, 3.1, 90.4], [x - 0.2, 3.1, 90.4], '#7c8388');
  });
  const strip = stripB.build(mat);
  strip.name = 'eastStrip';
  group.add(strip);
  const south = [[-4, 103, 26, 125, 7], [30, 104, 54, 128, 9], [78, 104, 100, 126, 6]];
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
  mesh.position.set(FLAGPOLE[0] + 2.3, 16.8, FLAGPOLE[1]);
  mesh.castShadow = true;
  const base = geo.attributes.position.array.slice();
  const wave = (t: number) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3] + 2.3;
      p.setZ(i, Math.sin(x * 1.8 + t * 4) * 0.12 * x);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return { mesh, wave };
}
