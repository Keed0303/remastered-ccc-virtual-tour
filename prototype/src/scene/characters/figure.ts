import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Gender, Look } from '../../types/character';
import { Batch } from '../world/Batch';

interface BodyOptions { skin: string; hair: string; longHair?: boolean; backpack?: boolean; gender?: Gender | null }
interface FigureOptions { backpack?: boolean }
interface FigureLimbs { legL: THREE.Mesh; legR: THREE.Mesh; armL: THREE.Mesh; armR: THREE.Mesh }

// Chunky voxel student figures in the CCC uniform: a big head, a short body, and slim limbs.
// Feet sit at y = 0 and the figure faces +z. Hip height and overall height match seats.ts and the name bubbles.
export const FIGURE = { hipY: 0.64, hipX: 0.1, shoulderY: 1.12, shoulderX: 0.27 };
export const FEMALE = { hipX: 0.085, shoulderX: 0.245, torso: 0.9 };
const UNIFORM = { white: '#f7f7f4', shade: '#dcdcd6', navy: '#16233f', pleat: '#0e1830', crest: '#2a7fc0', crestLight: '#7fd0ee', shoe: '#20242c', sole: '#3a3f47', sock: '#f2f2ee' };
const FACE = { pupil: '#1c2027', white: '#fbfbf7', mouth: '#a8614f', lips: '#c9605f' };

const shade = (color: string, amount: number) => new THREE.Color(color).multiplyScalar(amount);

function merged(batch: Batch) {
  const geo = mergeGeometries(batch.parts, false);
  batch.parts.forEach((p) => p.dispose());
  return geo;
}

function addHead(b: Batch, skin: string, hair: string, female: boolean, long: boolean) {
  const [w, y0, y1, d] = [0.27, 1.18, 1.7, 0.24];
  b.box(-0.07, 1.14, -0.07, 0.07, y0, 0.07, shade(skin, 0.82));
  b.box(-w, y0, -d, w, y1, d, skin);
  // Ears and a nose that stand out from the head.
  for (const s of [-1, 1]) b.box(s * w, 1.36, -0.05, s * (w + 0.035), 1.47, 0.05, shade(skin, 0.92));
  b.box(-0.04, 1.35, d, 0.04, 1.44, d + 0.05, shade(skin, 0.92));
  // White eyes with the pupils toward the middle, and thick eyebrows.
  for (const s of [-1, 1]) {
    const [a, c] = s < 0 ? [-0.2, -0.07] : [0.07, 0.2];
    b.box(a, 1.41, d, c, 1.5, d + 0.006, FACE.white);
    const [p0, p1] = s < 0 ? [-0.135, -0.07] : [0.07, 0.135];
    b.box(p0, 1.41, d, p1, 1.5, d + 0.012, FACE.pupil);
    b.box(a - 0.01, female ? 1.53 : 1.525, d, c + 0.01, female ? 1.555 : 1.575, d + 0.012, shade(hair, 0.85));
  }
  b.box(-0.07, 1.27, d, 0.07, 1.305, d + 0.006, female ? FACE.lips : FACE.mouth);

  // Hair: stepped blocks, with a little overhang so it reads as its own piece.
  const [hw, hd] = [w + 0.02, d + 0.02];
  b.box(-hw, 1.62, -hd, hw, 1.72, hd, hair);
  b.box(-hw + 0.045, 1.72, -hd + 0.045, hw - 0.045, 1.76, hd - 0.045, shade(hair, 1.12));
  b.box(-hw, long ? 0.9 : 1.32, -hd, hw, 1.62, -d + 0.07, hair);
  for (const s of [-1, 1]) {
    const inner = s * w, outer = s * hw;
    b.box(Math.min(inner, outer), long ? 1.0 : 1.48, -hd, Math.max(inner, outer), 1.62, long ? 0.1 : 0.02, hair);
    if (long) b.box(Math.min(inner, outer), 1.18, 0.1, Math.max(inner, outer), 1.62, 0.2, hair);
  }
  // Stepped bangs along the forehead.
  b.box(-hw, 1.585, d, hw, 1.62, hd, hair);
  [-0.21, -0.105, 0, 0.105, 0.21].forEach((x, i) => b.box(x - 0.0525, i % 2 ? 1.555 : 1.53, d, x + 0.0525, 1.585, hd, hair));
}

function addTorso(t: Batch, skin: string, backpack: boolean) {
  const [w, y0, y1, d] = [0.2, 0.64, 1.16, 0.11];
  t.box(-w, y0, -d, w, y1, d, UNIFORM.white);
  const front = d + 0.006;
  // Open collar with navy piping, a front placket, and the crest on the wearer's left chest.
  t.box(-0.06, 1.1, d, 0.06, y1, front + 0.002, skin);
  t.box(-0.03, 1.06, d, 0.03, 1.1, front + 0.002, skin);
  t.box(-0.11, 1.12, d, -0.06, y1, front, UNIFORM.navy);
  t.box(0.06, 1.12, d, 0.11, y1, front, UNIFORM.navy);
  t.box(-0.06, 1.07, d, -0.03, 1.12, front, UNIFORM.navy);
  t.box(0.03, 1.07, d, 0.06, 1.12, front, UNIFORM.navy);
  t.box(-0.02, 0.7, d, 0.02, 1.06, front, UNIFORM.navy);
  t.box(0.07, 0.93, d, 0.15, 1.02, front, UNIFORM.crest);
  t.box(0.09, 0.95, d, 0.13, 1, front + 0.002, UNIFORM.crestLight);
  // Pocket line, waistband, and the same piping on the back.
  t.box(-0.15, 0.97, d, -0.07, 0.985, front, UNIFORM.shade);
  t.box(-w, y0, -d - 0.006, w, y0 + 0.05, d + 0.006, UNIFORM.navy);
  t.box(-w, y1 - 0.05, -d - 0.006, w, y1, -d, UNIFORM.navy);
  if (backpack) {
    t.box(-0.16, 0.72, -0.21, 0.16, 1.1, -d, '#1f62b8');
    t.box(-0.12, 0.76, -0.235, 0.12, 0.94, -0.21, '#174a8c');
    for (const s of [-1, 1]) t.box(s * 0.13 - 0.025, 0.86, d, s * 0.13 + 0.025, y1, front, '#174a8c');
  }
}

// A pleated school skirt that flares out over the top of the legs.
function addSkirt(t: Batch) {
  const navy = UNIFORM.navy;
  t.box(-0.185, 0.56, -0.125, 0.185, 0.7, 0.125, navy);
  t.box(-0.215, 0.38, -0.15, 0.215, 0.56, 0.15, navy);
  for (let x = -0.18; x <= 0.18; x += 0.09) {
    for (const [z0, z1] of [[0.15, 0.156], [-0.156, -0.15]]) t.box(x - 0.012, 0.38, z0, x + 0.012, 0.56, z1, UNIFORM.pleat);
    for (const [z0, z1] of [[0.125, 0.131], [-0.131, -0.125]]) t.box(x - 0.012, 0.56, z0, x + 0.012, 0.66, z1, UNIFORM.pleat);
  }
  for (const s of [-1, 1]) t.box(s * 0.215 + (s < 0 ? -0.006 : 0), 0.38, -0.15, s * 0.215 + (s < 0 ? 0 : 0.006), 0.56, 0.15, UNIFORM.pleat);
}

export function figureBody({ skin, hair, longHair = false, backpack = false, gender = null }: BodyOptions) {
  const female = gender === 'female';
  const t = new Batch();
  addTorso(t, skin, backpack);
  const torso = merged(t);
  if (female) torso.scale(FEMALE.torso, 1, 0.95);

  const b = new Batch();
  addHead(b, skin, hair, female, longHair || female);
  if (female) addSkirt(b);
  b.parts.push(torso);
  return merged(b);
}

// Arm with its pivot at the shoulder: white sleeve, navy cuff, bare arm, and a blocky hand.
export function figureArm(skin: string) {
  const b = new Batch();
  b.box(-0.07, -0.2, -0.075, 0.07, 0.04, 0.075, UNIFORM.white);
  b.box(-0.075, -0.24, -0.08, 0.075, -0.2, 0.08, UNIFORM.navy);
  b.box(-0.06, -0.42, -0.065, 0.06, -0.24, 0.065, skin);
  b.box(-0.07, -0.5, -0.075, 0.07, -0.42, 0.075, shade(skin, 0.96));
  return merged(b);
}

// Leg with its pivot at the hip. Trousers by default, and bare legs with socks under a skirt.
export function figureLeg(skin?: string) {
  const b = new Batch();
  if (skin) {
    b.box(-0.07, -0.42, -0.075, 0.07, 0, 0.075, skin);
    b.box(-0.075, -0.54, -0.08, 0.075, -0.42, 0.08, UNIFORM.sock);
  } else {
    b.box(-0.085, -0.54, -0.09, 0.085, 0, 0.09, UNIFORM.navy);
  }
  b.box(-0.09, -0.6, -0.1, 0.09, -0.54, 0.14, UNIFORM.shoe);
  b.box(-0.095, -0.64, -0.105, 0.095, -0.6, 0.15, UNIFORM.sole);
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

// Blends from standing (0) to legs forward with hands on the knees (1). Sway swings the legs a little.
export function sitLimbs(figure: THREE.Object3D, amount: number, sway = 0) {
  const { legL, legR, armL, armR } = figure.userData as FigureLimbs;
  legL.rotation.x = -1.45 * amount + sway;
  legR.rotation.x = -1.45 * amount - sway;
  armL.rotation.x = -0.75 * amount;
  armR.rotation.x = -0.75 * amount;
}

// Replaces a figure's body parts for a new look, keeping its place in the world.
export function setFigureLook(g: THREE.Group, look: Look, { backpack = false }: FigureOptions = {}) {
  disposeFigure(g);
  g.children.filter((c) => c.userData.figurePart).forEach((c) => g.remove(c));
  const female = look.gender === 'female';
  const shoulderX = female ? FEMALE.shoulderX : FIGURE.shoulderX;
  const hipX = female ? FEMALE.hipX : FIGURE.hipX;
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
  const leg = () => figureLeg(female ? look.skin : undefined);
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
