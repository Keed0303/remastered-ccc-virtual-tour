import * as THREE from 'three';
import { Batch, C } from './Batch';
import { hipRoof, tree } from './props';
import { canvasTex } from './textures';

export function buildGround(mat: THREE.Material, glowMat: THREE.Material) {
  const group = new THREE.Group();
  const b = new Batch();
  const glow = new Batch();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 48), new THREE.MeshStandardMaterial({ color: '#d7dcdf', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true;
  group.add(ground);

  // Streets
  const road = (x0: number, z0: number, x1: number, z1: number) => b.box(x0, 0, z0, x1, 0.02, z1, C.asphalt);
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
        b.add(seg, metal);
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
  const hood = (x0: number, z0: number, x1: number, z1: number, h: number, tone = 0) => {
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
