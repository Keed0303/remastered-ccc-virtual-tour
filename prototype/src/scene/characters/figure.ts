import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Gender, Look } from '../../types/character';
import { Batch } from '../world/Batch';

interface BodyOptions { skin: string; hair: string; longHair?: boolean; backpack?: boolean; gender?: Gender | null }
interface FigureOptions { backpack?: boolean }
interface FigureLimbs { legL: THREE.Mesh; legR: THREE.Mesh; armL: THREE.Mesh; armR: THREE.Mesh }

// Blocky student figures with Minecraft-like proportions, in the CCC uniform.
// One pixel is 1/16 of the head-and-body scale. Feet sit at y = 0 and the figure faces +z.
const PX = 0.0525;
export const FIGURE = { hipY: 0.64, hipX: 0.105, shoulderY: 1.26, shoulderX: 0.315 };
const UNIFORM = { white: '#f7f7f4', navy: '#16233f', crest: '#2a7fc0', crestLight: '#7fd0ee', laurel: '#4f8a55', shoe: '#20242c' };
const FACE = { eye: '#20242c', white: '#f4f4f0', mouth: '#b9735c' };

function pixels(b: Batch, rows: string[], colors: Record<string, string>, x0: number, yTop: number, z: number, dir = 1) {
  rows.forEach((row, r) => {
    [...row].forEach((c, i) => {
      const color = colors[c];
      if (!color) return;
      const x = x0 + i * PX, y = yTop - r * PX;
      b.box(x, y - PX, z, x + PX, y, z + dir * 0.006, color);
    });
  });
}

function merged(batch: Batch) {
  const geo = mergeGeometries(batch.parts, false);
  batch.parts.forEach((p) => p.dispose());
  return geo;
}

export function figureBody({ skin, hair, longHair = false, backpack = false, gender = null }: BodyOptions) {
  const female = gender === 'female';
  const long = longHair || female;
  const t = new Batch();
  // Torso: blouse, with navy trousers starting at the waistband.
  t.box(-0.21, 0.64, -0.105, 0.21, 1.28, 0.105, UNIFORM.white);
  const colors: Record<string, string> = { N: UNIFORM.navy, S: skin, B: UNIFORM.crest, L: UNIFORM.crestLight, G: UNIFORM.laurel };
  // Open collar and front placket with navy piping, with the crest on the wearer's left chest.
  pixels(t, [
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
  t.box(-0.21, 1.2275, -0.111, 0.21, 1.28, -0.105, UNIFORM.navy);
  t.box(-0.21, 0.64, -0.111, 0.21, 0.6925, -0.105, UNIFORM.navy);
  if (backpack) {
    t.box(-0.17, 0.78, -0.21, 0.17, 1.2, -0.105, '#1f62b8');
    t.box(-0.13, 0.82, -0.235, 0.13, 1.02, -0.21, '#174a8c');
  }
  const torso = mergeGeometries(t.parts, false);
  t.parts.forEach((p) => p.dispose());
  if (female) torso.scale(0.86, 1, 0.95);

  const b = new Batch();
  // Head.
  b.box(-0.21, 1.28, -0.21, 0.21, 1.7, 0.21, skin);
  pixels(b, [
    'HHHHHHHH',
    'HHHHHHHH',
    female ? '.EE..EE.' : '........',
    '.WE..EW.',
    '........',
    '...MM...',
  ], { H: hair, W: FACE.white, E: FACE.eye, M: female ? '#c9605f' : FACE.mouth }, -0.21, 1.7, 0.21);
  // Hair: a slightly larger cap so it reads as a separate block.
  b.box(-0.22, 1.6, -0.22, 0.22, 1.72, 0.22, hair);
  b.box(-0.22, long ? 0.98 : 1.32, -0.22, 0.22, 1.72, -0.15, hair);
  b.box(-0.22, long ? 1.08 : 1.46, -0.22, -0.2, 1.72, 0.1, hair);
  b.box(0.2, long ? 1.08 : 1.46, -0.22, 0.22, 1.72, 0.1, hair);
  b.parts.push(torso);
  return merged(b);
}

// Arm with its pivot at the shoulder: white sleeve, navy cuff, then bare arm.
export function figureArm(skin: string) {
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

// Shared by every figure for the life of the page. Each figure owns only its geometry.
const figureMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true });

export function disposeFigure(figure: THREE.Object3D) {
  figure.traverse((o) => { if (o instanceof THREE.Mesh && o.userData.figurePart) o.geometry.dispose(); });
}

// Swings the arms and legs against each other. Zero stands the figure still.
export function swingLimbs(figure: THREE.Object3D, swing: number) {
  const { legL, legR, armL, armR } = figure.userData as FigureLimbs;
  legL.rotation.x = swing;
  legR.rotation.x = -swing;
  armL.rotation.x = -swing;
  armR.rotation.x = swing;
}

// Replaces a figure's body parts for a new look, keeping its place in the world.
export function setFigureLook(g: THREE.Group, look: Look, { backpack = false }: FigureOptions = {}) {
  disposeFigure(g);
  g.children.filter((c) => c.userData.figurePart).forEach((c) => g.remove(c));
  const female = look.gender === 'female';
  const shoulderX = female ? 0.27 : FIGURE.shoulderX;
  const hipX = female ? 0.09 : FIGURE.hipX;
  const part = (geo: THREE.BufferGeometry, x: number, y: number) => {
    const m = new THREE.Mesh(geo, figureMat);
    m.position.set(x, y, 0);
    m.castShadow = true;
    m.userData.figurePart = true;
    g.add(m);
    return m;
  };
  const arm = () => {
    const geo = figureArm(look.skin);
    if (female) geo.scale(0.82, 1, 0.9);
    return geo;
  };
  const leg = () => {
    const geo = figureLeg();
    if (female) geo.scale(0.86, 1, 0.95);
    return geo;
  };
  part(figureBody({ skin: look.skin, hair: look.hair, gender: look.gender, backpack }), 0, 0);
  g.userData.armL = part(arm(), shoulderX, FIGURE.shoulderY);
  g.userData.armR = part(arm(), -shoulderX, FIGURE.shoulderY);
  g.userData.legL = part(leg(), hipX, FIGURE.hipY);
  g.userData.legR = part(leg(), -hipX, FIGURE.hipY);
  g.userData.look = look;
  return g;
}

export function createPlayerFigure(look: Look, options: FigureOptions = {}) {
  const g = new THREE.Group();
  g.scale.setScalar(1.15);
  return setFigureLook(g, look, options);
}

// The player's own character, with a backpack and a ring so it is easy to find.
export function createAvatar(look: Look) {
  const g = createPlayerFigure(look, { backpack: true });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.78, 30), new THREE.MeshBasicMaterial({ color: '#2f7be0', transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);
  return g;
}
