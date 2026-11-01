import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAccountUI } from './account.js';
import { createBackend } from './utils/backend';
import { createOnline } from './online.js';
import { BADGES, BUILDING_LABELS, FLOORS, LOCATIONS, DEFAULT_LOOK, NPC_MAX, NORTH_YAW_DEG, RANKS, THEMES, VIEWS } from './utils/campusData';
import { COLLIDERS, WALK_BOUNDS, cameraCeiling, floorHeight, indoorBounds } from './utils/physics';
import { cleanSettings } from './utils/validation';
import { FIGURE, buildWorld, createAvatar, setFigureLook, figureArm, figureBody, figureLeg } from './world.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 1, 1600);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.46;
controls.minDistance = 8;
controls.maxDistance = 340;

const hemi = new THREE.HemisphereLight('#ffffff', '#c5ccc4', 1);
const sun = new THREE.DirectionalLight('#ffffff', 3);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 480 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.25;
sun.target.position.set(24, 0, -15);
scene.add(hemi, sun, sun.target);

const world = buildWorld(scene);

/* ---------- People and vehicles ---------- */
// Meshes are sized for the maximum, and only the active number is drawn.
const WALKERS = NPC_MAX;
let activeWalkers = 46;
const figureMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true });
const peopleGroup = new THREE.Group();
scene.add(peopleGroup);
const looks = [
  { skin: '#e0ac84', hair: '#1f1712' },
  { skin: '#c98d63', hair: '#2d1c12', longHair: true },
  { skin: '#b97a52', hair: '#17120e' },
  { skin: '#d9a47e', hair: '#3a2a1c', longHair: true },
];
function instanced(geo, count) {
  const mesh = new THREE.InstancedMesh(geo, figureMat, count);
  mesh.castShadow = true;
  // Students spread across the campus, so the mesh is never culled as one block.
  mesh.frustumCulled = false;
  peopleGroup.add(mesh);
  return mesh;
}
const perLook = Math.ceil(WALKERS / looks.length);
const bodyMeshes = looks.map((look) => instanced(figureBody(look), perLook));
const armMeshes = looks.map((look) => instanced(figureArm(look.skin), perLook * 2));
const legMesh = instanced(figureLeg(), WALKERS * 2);
const walkPaths = [
  [[30, -118], [30, -62]], [[38, -62], [38, -118]], [[24, -62], [24, -51]], [[26, -112], [44, -112]],
  [[-6, -22], [-6, 48]], [[47, -49], [47, -41]], [[-5.8, 54], [-5.8, 88]], [[20, -60], [46, -60]],
];
const walkers = Array.from({ length: WALKERS }, (_, i) => {
  const path = walkPaths[i % walkPaths.length];
  return { path, t: Math.random(), speed: 0.012 + Math.random() * 0.016, dir: i % 2 ? 1 : -1, off: (Math.random() - 0.5) * 3.2, off2: (Math.random() - 0.5) * 3.2, phase: Math.random() * 6.28 };
});
const rootObj = new THREE.Object3D();
const limbObj = new THREE.Object3D();
const limbMatrix = new THREE.Matrix4();
function setLimb(mesh, index, x, y, swing) {
  limbObj.position.set(x, y, 0);
  limbObj.rotation.set(swing, 0, 0);
  limbObj.updateMatrix();
  limbMatrix.multiplyMatrices(rootObj.matrix, limbObj.matrix);
  mesh.setMatrixAt(index, limbMatrix);
}
function updateWalkers(dt, time) {
  const counters = looks.map(() => 0);
  walkers.slice(0, activeWalkers).forEach((w, i) => {
    w.t += w.speed * dt * w.dir;
    if (w.t > 1 || w.t < 0) { w.dir *= -1; w.t = THREE.MathUtils.clamp(w.t, 0, 1); }
    const [a, b] = w.path;
    const x = a[0] + (b[0] - a[0]) * w.t + w.off, z = a[1] + (b[1] - a[1]) * w.t + w.off2;
    rootObj.position.set(x, 0.02, z);
    rootObj.rotation.set(0, Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir), 0);
    rootObj.scale.setScalar(1.15);
    rootObj.updateMatrix();
    const look = i % looks.length;
    const n = counters[look]++;
    bodyMeshes[look].setMatrixAt(n, rootObj.matrix);
    const swing = Math.sin(time * 5.5 + w.phase) * 0.6;
    setLimb(armMeshes[look], n * 2, FIGURE.shoulderX, FIGURE.shoulderY, -swing);
    setLimb(armMeshes[look], n * 2 + 1, -FIGURE.shoulderX, FIGURE.shoulderY, swing);
    setLimb(legMesh, i * 2, FIGURE.hipX, FIGURE.hipY, swing);
    setLimb(legMesh, i * 2 + 1, -FIGURE.hipX, FIGURE.hipY, -swing);
  });
  looks.forEach((_, l) => {
    bodyMeshes[l].count = counters[l];
    armMeshes[l].count = counters[l] * 2;
    bodyMeshes[l].instanceMatrix.needsUpdate = true;
    armMeshes[l].instanceMatrix.needsUpdate = true;
  });
  legMesh.count = activeWalkers * 2;
  legMesh.instanceMatrix.needsUpdate = true;
}

const vehicles = new THREE.Group();
scene.add(vehicles);
const carColors = ['#f4f6f8', '#c43d3d', '#3c6ec2', '#30343c', '#e0b23f', '#f4f6f8'];
function makeCar(color, tricycle) {
  const g = new THREE.Group();
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, flatShading: true });
  const add = (w, h, d, c, y, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c)); o.position.set(0, y, z); o.castShadow = true; g.add(o); };
  if (tricycle) {
    add(1.3, 0.9, 2.2, color, 0.8); add(1.4, 0.1, 2.5, '#22262c', 1.85); add(1.2, 0.7, 1.4, '#253244', 1.35, -0.2);
  } else {
    add(1.8, 0.7, 4.2, color, 0.65); add(1.55, 0.6, 2.2, '#253244', 1.25, -0.2);
  }
  return g;
}
const traffic = [];
const lanes = [
  { axis: 'z', fixed: -14.2, dir: 1, range: [-220, 210] }, { axis: 'z', fixed: -9.6, dir: -1, range: [-220, 210] },
  { axis: 'x', fixed: -56, dir: 1, range: [-110, 155] }, { axis: 'x', fixed: -52.4, dir: -1, range: [-110, 155] },
  { axis: 'z', fixed: 61, dir: 1, range: [-48, 210] }, { axis: 'z', fixed: 65, dir: -1, range: [-48, 210] },
  { axis: 'x', fixed: 97.5, dir: -1, range: [-110, 155] },
];
lanes.forEach((lane, i) => {
  for (let k = 0; k < 2; k++) {
    const car = makeCar(carColors[(i + k) % carColors.length], (i + k) % 3 === 0);
    if (lane.axis === 'z') car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
    else car.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    vehicles.add(car);
    traffic.push({ car, lane, p: lane.range[0] + Math.random() * (lane.range[1] - lane.range[0]), v: 7 + Math.random() * 4 });
  }
});
function updateTraffic(dt) {
  for (const t of traffic) {
    t.p += t.v * dt * t.lane.dir;
    const [a, b] = t.lane.range;
    if (t.p > b) t.p = a; else if (t.p < a) t.p = b;
    if (t.lane.axis === 'z') t.car.position.set(t.lane.fixed, 0, t.p);
    else t.car.position.set(t.p, 0, t.lane.fixed);
  }
}

/* ---------- Saved game state ---------- */
const SAVE_KEY = 'ccc-campus-passport-v1';
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && Array.isArray(s.stamps) && Array.isArray(s.quiz)) return { xp: 0, badges: [], ...s };
  } catch { /* Private windows can block storage. */ }
  return { xp: 0, stamps: [], quiz: [], badges: [] };
}
let game = loadState();
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch { /* Progress stays for this visit only. */ }
}
const XP_PER_LEVEL = 200;
const STAMP_XP = 50, QUIZ_XP = 25;

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.textContent = text;
  $('toast').append(el);
  setTimeout(() => el.remove(), 3200);
}
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#1f62b8', '#f2c94c', '#d94a3d', '#58a05c', '#ffffff'];
  for (let i = 0; i < 44; i++) {
    const d = document.createElement('i');
    d.className = 'confetti';
    d.style.left = `${50 + (Math.random() - 0.5) * 34}%`;
    d.style.background = colors[i % colors.length];
    d.style.setProperty('--x', `${(Math.random() - 0.5) * 420}px`);
    d.style.setProperty('--r', `${Math.random() * 720}deg`);
    d.style.animationDelay = `${Math.random() * 0.16}s`;
    document.body.append(d);
    setTimeout(() => d.remove(), 1700);
  }
}
function setPassportOpen(open) {
  document.body.classList.toggle('passport-open', open);
  $('passport-fab').setAttribute('aria-expanded', String(open));
}
$('passport-fab').onclick = () => setPassportOpen(!document.body.classList.contains('passport-open'));
$('passport-close').onclick = () => setPassportOpen(false);
function renderPassport() {
  const lvl = Math.floor(game.xp / XP_PER_LEVEL);
  $('level').textContent = `Level ${lvl + 1} ${RANKS[Math.min(lvl, RANKS.length - 1)]}`;
  $('xp').textContent = `${game.xp} XP`;
  $('xp-bar').style.width = `${((game.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%`;
  $('fab-count').textContent = `${game.stamps.length}/${LOCATIONS.length}`;
  const stamps = $('stamps');
  stamps.replaceChildren(...LOCATIONS.map((l) => {
    const b = document.createElement('button');
    const got = game.stamps.includes(l.id);
    b.className = `stamp${got ? ' got' : ''}`;
    b.title = l.name;
    b.setAttribute('aria-label', `${l.name}${got ? ', stamped' : ''}`);
    b.textContent = got ? '★' : LOCATIONS.indexOf(l) + 1;
    b.onclick = () => { setPassportOpen(false); selectLocation(l.id, true); };
    return b;
  }));
  $('badges').replaceChildren(...BADGES.map((bd) => {
    const s = document.createElement('span');
    const got = game.badges.includes(bd.id);
    s.className = `badge${got ? ' got' : ''}`;
    s.title = bd.name + (got ? '' : ' (locked)');
    s.textContent = bd.icon;
    return s;
  }));
}
function award(amount, reason) {
  const before = Math.floor(game.xp / XP_PER_LEVEL);
  game.xp += amount;
  toast(`+${amount} XP · ${reason}`);
  if (Math.floor(game.xp / XP_PER_LEVEL) > before) toast('Level up!');
  for (const bd of BADGES) {
    if (!game.badges.includes(bd.id) && bd.test(game)) {
      game.badges.push(bd.id);
      toast(`${bd.icon} Badge earned: ${bd.name}`);
      confetti();
    }
  }
  saveState();
  renderPassport();
}
function checkIn(id) {
  if (game.stamps.includes(id)) return;
  game.stamps.push(id);
  award(STAMP_XP, 'Passport stamped');
  confetti();
  if (selected?.id === id) renderCard(selected);
}
$('legal-link').onclick = () => $('legal-dialog').showModal();
$('reset').onclick = () => {
  game = { xp: 0, stamps: [], quiz: [], badges: [] };
  saveState();
  renderPassport();
  if (selected) renderCard(selected);
  toast('Progress reset');
};

/* ---------- Views, tweening, and floors ---------- */
let mode = 'orbit';
let currentView = 'overview';
let selected = null;
let tween = null;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
// Portrait screens need the camera further back to fit the same width.
function fitCamera(pos, target) {
  const scale = Math.min(2.2, Math.max(1, 1.25 / (innerWidth / innerHeight)));
  return new THREE.Vector3(...pos).sub(new THREE.Vector3(...target)).multiplyScalar(scale).add(new THREE.Vector3(...target));
}
function flyTo(pos, target, dur = 1.25, fit = true) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0.01;
  tween = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: fit ? fitCamera(pos, target) : new THREE.Vector3(...pos), t1: new THREE.Vector3(...target) };
}
function showFloor(key) {
  for (const [k, g] of Object.entries(world.floors)) g.visible = k === key;
  const bldg = key ? FLOORS[key].building : null;
  world.oldB.visible = bldg !== 'old';
  world.newB.visible = bldg !== 'new';
  world.hall.visible = bldg !== 'old';
  world.ground.getObjectByName('eastStrip').visible = !key;
}
function setView(id, fly = true) {
  const v = VIEWS.find((x) => x.id === id);
  currentView = id;
  showFloor(v.floor || null);
  if (fly) flyTo(v.cam, v.target);
  document.querySelectorAll('#views button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
  refreshLabels();
}
$('views').replaceChildren(...VIEWS.map((v) => {
  const b = document.createElement('button');
  b.dataset.id = v.id;
  b.textContent = v.name;
  b.onclick = () => { if (mode === 'walk') stopWalk(); setView(v.id); };
  return b;
}));

/* ---------- Floating labels ---------- */
const labels = [];
function addLabel(def, onclick) {
  const el = document.createElement('button');
  el.className = `pin${def.big ? ' big' : ''}`;
  el.textContent = def.name;
  el.onclick = onclick;
  $('labels').append(el);
  labels.push({ def, el, v: new THREE.Vector3(...def.pos) });
}
LOCATIONS.forEach((l) => addLabel(l, () => selectLocation(l.id, true)));
BUILDING_LABELS.forEach((b) => addLabel(b, () => (b.view ? setView(b.view) : toast(b.note))));
let labelsOn = true;
function refreshLabels() {
  const floor = VIEWS.find((v) => v.id === currentView)?.floor || null;
  for (const lb of labels) {
    const d = lb.def;
    let show;
    if (d.id.startsWith('_')) show = !floor;
    else show = (d.floor || null) === floor;
    lb.show = show && labelsOn && mode !== 'pano';
    lb.el.classList.toggle('stamped', game.stamps.includes(d.id));
  }
}
const proj = new THREE.Vector3();
function updateLabels() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  // Campus labels would show through the walls while the player is indoors.
  const indoors = walkActive && indoorBounds(avatar.position.x, avatar.position.z);
  $('labels').style.display = indoors ? 'none' : '';
  if (indoors) return;
  for (const lb of labels) {
    if (!lb.show) { lb.el.style.display = 'none'; continue; }
    proj.copy(lb.v).project(camera);
    if (proj.z > 1) { lb.el.style.display = 'none'; continue; }
    lb.el.style.display = 'block';
    lb.el.style.transform = `translate(-50%,-100%) translate(${(proj.x * 0.5 + 0.5) * w}px,${(-proj.y * 0.5 + 0.5) * h}px)`;
    lb.el.classList.toggle('active', selected?.id === lb.def.id);
  }
}

/* ---------- Info card ---------- */
function renderCard(l) {
  $('card').hidden = false;
  $('card-photo').style.backgroundImage = `url(${l.pano})`;
  $('card-kind').textContent = l.kind;
  $('card-title').textContent = l.name;
  $('card-text').replaceChildren(...l.text.map((t) => { const p = document.createElement('p'); p.textContent = t; return p; }));

  const actions = $('card-actions');
  actions.replaceChildren();
  const pano = document.createElement('button');
  pano.className = 'primary';
  pano.textContent = 'Open 360° photo';
  pano.onclick = () => openPano(l);
  const stamp = document.createElement('button');
  const got = game.stamps.includes(l.id);
  stamp.className = got ? 'done' : 'accent';
  stamp.textContent = got ? '★ Stamped' : `Check in · +${STAMP_XP} XP`;
  stamp.disabled = got;
  stamp.onclick = () => checkIn(l.id);
  actions.append(pano, stamp);

  const qBox = $('card-quiz');
  qBox.replaceChildren();
  if (l.quiz && got) {
    const done = game.quiz.includes(l.id);
    const title = document.createElement('p');
    title.className = 'quiz-q';
    title.textContent = done ? `Quiz complete · ${l.quiz.q}` : `Bonus quiz · +${QUIZ_XP} XP: ${l.quiz.q}`;
    qBox.append(title);
    l.quiz.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-o';
      b.textContent = o;
      if (done) { b.disabled = true; if (i === l.quiz.answer) b.classList.add('right'); }
      b.onclick = () => {
        if (i === l.quiz.answer) {
          game.quiz.push(l.id);
          award(QUIZ_XP, 'Correct answer');
          renderCard(l);
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          toast('Not quite. Read the panel and try again.');
        }
      };
      qBox.append(b);
    });
  }
}
function selectLocation(id, fly) {
  const l = LOCATIONS.find((x) => x.id === id);
  selected = l;
  if (mode === 'walk' && fly) stopWalk();
  if (l.floor && currentView !== l.floor) setView(l.floor, false);
  if (!l.floor && VIEWS.find((v) => v.id === currentView)?.floor) setView(l.id === 'entrance' ? 'overview' : 'plaza', false);
  renderCard(l);
  if (fly && mode === 'orbit') {
    const [x, , z] = l.pos;
    const t = [x, l.floor ? 0 : Math.min(l.pos[1], 4), z];
    const p = l.floor ? [x, 34, z + 30] : [x - 36, 27, z - 38];
    flyTo(p, t);
  }
  refreshLabels();
}
$('card-close').onclick = () => { $('card').hidden = true; selected = null; };

/* ---------- 360 degree photo viewer ---------- */
const panoScene = new THREE.Scene();
const panoCam = new THREE.PerspectiveCamera(75, 1, 0.1, 1200);
const panoGeo = new THREE.SphereGeometry(500, 64, 40);
// The original panoramas are stored mirrored, so the inside of an unflipped sphere reads correctly.
const panoMat = new THREE.MeshBasicMaterial({ color: '#222', side: THREE.BackSide });
panoScene.add(new THREE.Mesh(panoGeo, panoMat));
const panoLoader = new THREE.TextureLoader();
const panoView = { yaw: 0, pitch: 0, drag: null };
function openPano(l) {
  mode = 'pano';
  $('pano-ui').hidden = false;
  $('pano-name').textContent = l.name;
  document.body.classList.add('in-pano');
  panoView.yaw = 0; panoView.pitch = 0; panoCam.fov = 75; panoCam.updateProjectionMatrix();
  controls.enabled = false;
  refreshLabels();
  panoLoader.load(l.pano, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    panoMat.map?.dispose();
    panoMat.map = t;
    panoMat.color.set('#ffffff');
    panoMat.needsUpdate = true;
  }, undefined, () => toast('Could not load this 360° photo.'));
}
function closePano() {
  mode = walkActive ? 'walk' : 'orbit';
  $('pano-ui').hidden = true;
  document.body.classList.remove('in-pano');
  controls.enabled = !walkActive;
  refreshLabels();
}
$('pano-close').onclick = closePano;
canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'pano') return;
  panoView.drag = [e.clientX, e.clientY];
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (mode !== 'pano' || !panoView.drag) return;
  const k = 0.11 * (panoCam.fov / 75);
  panoView.yaw -= (e.clientX - panoView.drag[0]) * k;
  panoView.pitch = THREE.MathUtils.clamp(panoView.pitch + (e.clientY - panoView.drag[1]) * k, -85, 85);
  panoView.drag = [e.clientX, e.clientY];
});
addEventListener('pointerup', () => { panoView.drag = null; });
canvas.addEventListener('wheel', (e) => {
  if (mode !== 'pano') return;
  e.preventDefault();
  panoCam.fov = THREE.MathUtils.clamp(panoCam.fov + e.deltaY * 0.04, 35, 95);
  panoCam.updateProjectionMatrix();
}, { passive: false });
function updatePanoCam() {
  const y = THREE.MathUtils.degToRad(panoView.yaw), p = THREE.MathUtils.degToRad(panoView.pitch);
  panoCam.lookAt(Math.cos(p) * Math.sin(y) * 10, Math.sin(p) * 10, -Math.cos(p) * Math.cos(y) * 10);
}

/* ---------- On-foot mode ---------- */
const avatar = createAvatar(DEFAULT_LOOK);
avatar.visible = false;
scene.add(avatar);
const keys = new Set();
let walkActive = false;
let nearby = null;
let walkPhase = 0;
let fallSpeed = 0;
const GRAVITY = 19, JUMP_SPEED = 5.8, STEP_LIMIT = 0.5;
function startWalk() {
  walkActive = true;
  mode = 'walk';
  setView('overview', false);
  avatar.visible = true;
  avatar.position.set(29, floorHeight(29, -116), -116);
  avatar.rotation.y = Math.PI;
  fallSpeed = 0;
  document.body.classList.add('walking');
  camera.clearViewOffset();
  $('walk-ui').hidden = false;
  $('card').hidden = true;
  selected = null;
  tween = null;
  controls.enabled = false;
  look.yaw = Math.PI;
  look.pitch = 0.32;
  look.distance = 6.5;
  look.actual = 6.5;
  updateFollowCamera(0);
  refreshLabels();
}
function stopWalk() {
  walkActive = false;
  mode = 'orbit';
  avatar.visible = false;
  document.body.classList.remove('walking');
  $('walk-ui').hidden = true;
  $('prompt').hidden = true;
  keys.clear();
  releaseMouse();
  look.drag = null;
  controls.enabled = true;
  controls.target.copy(avatar.position);
  resize();
  setView('overview');
}
$('btn-walk').onclick = () => (walkActive ? stopWalk() : startWalk());
$('walk-exit').onclick = stopWalk;
addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    // The first Esc only frees the mouse, as in most games.
    if (document.pointerLockElement || performance.now() - mouseFreedAt < 250) return;
    if (mode === 'pano') closePano();
    else if (walkActive) stopWalk();
    else if (selected) { $('card').hidden = true; selected = null; }
    return;
  }
  if (e.target instanceof HTMLInputElement || !walkActive || mode !== 'walk') return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'].includes(e.code)) {
    keys.add(e.code);
    e.preventDefault();
  }
  if (e.code === 'KeyE') checkInNearby();
});
function checkInNearby() {
  if (!nearby) return;
  releaseMouse();
  selected = nearby;
  renderCard(nearby);
  checkIn(nearby.id);
}
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

/* ---------- Touch controls ---------- */
const stick = { x: 0, y: 0, id: null };
const STICK_RADIUS = 52, STICK_DEADZONE = 0.14;
function moveStick(e) {
  const r = $('stick').getBoundingClientRect();
  let dx = (e.clientX - (r.left + r.width / 2)) / STICK_RADIUS;
  let dy = (e.clientY - (r.top + r.height / 2)) / STICK_RADIUS;
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  $('stick-knob').style.transform = `translate(${dx * STICK_RADIUS}px,${dy * STICK_RADIUS}px)`;
  const live = Math.hypot(dx, dy) > STICK_DEADZONE;
  stick.x = live ? dx : 0;
  stick.y = live ? -dy : 0;
}
function endStick() {
  stick.x = 0; stick.y = 0; stick.id = null;
  $('stick-knob').style.transform = '';
}
$('stick').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  stick.id = e.pointerId;
  try { $('stick').setPointerCapture(e.pointerId); } catch { /* Movement still works without capture. */ }
  moveStick(e);
});
$('stick').addEventListener('pointermove', (e) => { if (e.pointerId === stick.id) moveStick(e); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  $('stick').addEventListener(type, (e) => { if (e.pointerId === stick.id) endStick(); });
}
$('btn-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); keys.add('Space'); });
for (const type of ['pointerup', 'pointerleave', 'pointercancel']) $('btn-jump').addEventListener(type, () => keys.delete('Space'));
$('btn-checkin').onclick = () => checkInNearby();
const R = 0.5;
const blocked = (x, z) => COLLIDERS.some((c) => x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R);
const fwd = new THREE.Vector3();
function updateWalk(dt) {
  let ax = 0, az = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) az += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) az -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ax -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ax += 1;
  ax += stick.x;
  az += stick.y;
  const moving = ax || az;
  if (moving) {
    fwd.set(-Math.sin(look.yaw), 0, -Math.cos(look.yaw));
    const rx = -fwd.z, rz = fwd.x;
    let dx = fwd.x * az + rx * ax, dz = fwd.z * az + rz * ax;
    const len = Math.hypot(dx, dz);
    dx /= len; dz /= len;
    // The joystick walks at a speed set by how far it is pushed, and runs near its edge.
    const pushed = Math.min(1, Math.hypot(ax, az));
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(stick.x, stick.y) > 0.92;
    const speed = (running ? 11 : 5.6) * pushed * dt;
    const b = WALK_BOUNDS;
    const nx = THREE.MathUtils.clamp(avatar.position.x + dx * speed, b.x0, b.x1);
    const nz = THREE.MathUtils.clamp(avatar.position.z + dz * speed, b.z0, b.z1);
    // A move is allowed when nothing solid is in the way and the surface ahead is low enough to step onto.
    const canStand = (x, z) => !blocked(x, z) && floorHeight(x, z) - avatar.position.y <= STEP_LIMIT;
    if (canStand(nx, avatar.position.z)) avatar.position.x = nx;
    if (canStand(avatar.position.x, nz)) avatar.position.z = nz;
    // Turn smoothly toward the direction of travel.
    const turn = Math.atan2(Math.sin(Math.atan2(dx, dz) - avatar.rotation.y), Math.cos(Math.atan2(dx, dz) - avatar.rotation.y));
    avatar.rotation.y += turn * Math.min(1, dt * 12);
    walkPhase += dt * 11;
  }
  // Gravity, with a quick climb when the feet meet a higher step.
  const floor = floorHeight(avatar.position.x, avatar.position.z);
  const grounded = avatar.position.y <= floor + 0.04 && fallSpeed <= 0;
  if (grounded && keys.has('Space')) fallSpeed = JUMP_SPEED;
  if (avatar.position.y < floor && fallSpeed <= 0) {
    avatar.position.y = Math.min(floor, avatar.position.y + Math.max(floor - avatar.position.y, 0.05) * Math.min(1, dt * 16));
    fallSpeed = 0;
  } else {
    fallSpeed -= GRAVITY * dt;
    avatar.position.y += fallSpeed * dt;
    if (avatar.position.y <= floor && fallSpeed <= 0) { avatar.position.y = floor; fallSpeed = 0; }
  }
  const swing = moving ? Math.sin(walkPhase) * 0.5 : 0;
  avatar.userData.legL.rotation.x = swing;
  avatar.userData.legR.rotation.x = -swing;
  avatar.userData.armL.rotation.x = -swing;
  avatar.userData.armR.rotation.x = swing;

  nearby = null;
  let best = 7.5;
  for (const l of LOCATIONS) {
    const spot = l.walkPos || (l.floor ? null : [l.pos[0], l.pos[2]]);
    if (!spot) continue;
    const d = Math.hypot(spot[0] - avatar.position.x, spot[1] - avatar.position.z);
    if (d < best) { best = d; nearby = l; }
  }
  const prompt = $('prompt');
  prompt.hidden = !nearby;
  $('btn-checkin').hidden = !nearby || game.stamps.includes(nearby.id);
  if (nearby) prompt.textContent = game.stamps.includes(nearby.id) ? `${nearby.name} · Stamped ★` : `${nearby.name} · ${matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'Tap Check in' : 'Press E to check in'}`;
}

/* ---------- Third-person camera ---------- */
let mouseFreedAt = -1000;
const look = { yaw: Math.PI, pitch: 0.32, distance: 6.5, actual: 6.5, drag: null };
const LOOK_SPEED = 0.0032, PITCH_MIN = -0.3, PITCH_MAX = 1.25, ZOOM_MIN = 2.5, ZOOM_MAX = 14;
const CAMERA_GAP = 0.3;
const camTarget = new THREE.Vector3();
const camWanted = new THREE.Vector3();

function turnCamera(dx, dy) {
  look.yaw -= dx * LOOK_SPEED;
  look.pitch = THREE.MathUtils.clamp(look.pitch + dy * LOOK_SPEED, PITCH_MIN, PITCH_MAX);
}
function releaseMouse() {
  if (document.pointerLockElement) document.exitPointerLock?.();
}
canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'walk') return;
  look.drag = [e.clientX, e.clientY, e.pointerId];
  // Capture the mouse like a game. Holding and dragging still works if the browser refuses.
  if (e.pointerType === 'mouse' && !document.pointerLockElement) {
    try { canvas.requestPointerLock()?.catch?.(() => {}); } catch { /* Dragging remains available. */ }
  }
});
addEventListener('pointermove', (e) => {
  if (mode !== 'walk') return;
  if (document.pointerLockElement === canvas) {
    turnCamera(e.movementX, e.movementY);
  } else if (look.drag && e.pointerId === look.drag[2]) {
    turnCamera(e.clientX - look.drag[0], e.clientY - look.drag[1]);
    look.drag = [e.clientX, e.clientY, e.pointerId];
  }
});
for (const type of ['pointerup', 'pointercancel']) {
  addEventListener(type, (e) => { if (look.drag && e.pointerId === look.drag[2]) look.drag = null; });
}
canvas.addEventListener('wheel', (e) => {
  if (mode !== 'walk') return;
  e.preventDefault();
  look.distance = THREE.MathUtils.clamp(look.distance + e.deltaY * 0.008, ZOOM_MIN, ZOOM_MAX);
}, { passive: false });
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) mouseFreedAt = performance.now();
  document.body.classList.toggle('mouse-locked', !!document.pointerLockElement);
});

// How far the camera can sit from the player before a wall gets in the way, from 0 to 1.
function clearPath(from, to) {
  let best = 1;
  const dx = to.x - from.x, dz = to.z - from.z, dy = to.y - from.y;
  for (const c of COLLIDERS) {
    if (c.top === 0) continue;
    let t0 = 0, t1 = 1, hit = true;
    for (const [o, d, a, b] of [[from.x, dx, c.x0 - CAMERA_GAP, c.x1 + CAMERA_GAP], [from.z, dz, c.z0 - CAMERA_GAP, c.z1 + CAMERA_GAP]]) {
      if (Math.abs(d) < 1e-6) { if (o < a || o > b) hit = false; continue; }
      let n = (a - o) / d, f = (b - o) / d;
      if (n > f) [n, f] = [f, n];
      t0 = Math.max(t0, n); t1 = Math.min(t1, f);
    }
    if (!hit || t0 > t1 || t0 <= 0) continue;
    if (c.top !== undefined && from.y + dy * t0 > c.top) continue;
    best = Math.min(best, t0);
  }
  return best;
}

function updateFollowCamera(dt) {
  camTarget.set(avatar.position.x, avatar.position.y + 1.65, avatar.position.z);
  const cosP = Math.cos(look.pitch);
  camWanted.set(Math.sin(look.yaw) * cosP, Math.sin(look.pitch), Math.cos(look.yaw) * cosP).multiplyScalar(look.distance).add(camTarget);
  // Stay under ceilings and above the floor before checking walls.
  const ceiling = cameraCeiling(camWanted.x, camWanted.z);
  if (camWanted.y > ceiling) camWanted.y = ceiling;
  const free = clearPath(camTarget, camWanted) * look.distance;
  // Move in at once when a wall blocks the view, and back out gently.
  look.actual = free < look.actual ? free : look.actual + (free - look.actual) * Math.min(1, dt * 5 || 1);
  const k = look.distance > 0 ? look.actual / look.distance : 1;
  camera.position.lerpVectors(camTarget, camWanted, k);
  const floorY = floorHeight(camera.position.x, camera.position.z) + 0.3;
  if (camera.position.y < floorY) camera.position.y = floorY;
  camera.lookAt(camTarget);
}

/* ---------- Themes and layer toggles ---------- */
function applyTheme(id) {
  const t = THEMES.find((x) => x.id === id);
  scene.background = new THREE.Color(t.sky);
  scene.fog = new THREE.Fog(t.fog, 240, 760);
  sun.color.set(t.sun);
  sun.intensity = t.sunI;
  sun.position.set(...t.pos).add(sun.target.position);
  hemi.intensity = t.hemi;
  hemi.groundColor.set(t.hemiG);
  world.glassMat.emissiveIntensity = t.glow;
  world.lampMat.emissiveIntensity = t.lamps;
  document.querySelectorAll('#themes button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
}
$('themes').replaceChildren(...THEMES.map((t) => {
  const b = document.createElement('button');
  b.dataset.id = t.id;
  b.textContent = t.name;
  b.onclick = () => applyTheme(t.id);
  return b;
}));
const layers = [
  { id: 'people', name: 'Students', on: true, set: (v) => { peopleGroup.visible = v; } },
  { id: 'cars', name: 'Vehicles', on: true, set: (v) => { vehicles.visible = v; } },
  { id: 'labels', name: 'Labels', on: true, set: (v) => { labelsOn = v; refreshLabels(); } },
  { id: 'wire', name: 'Wireframe', on: false, set: (v) => { world.mat.wireframe = v; } },
];
$('toggles').replaceChildren(...layers.map((l) => {
  const b = document.createElement('button');
  l.button = b;
  l.startsOn = l.on;
  b.textContent = l.name;
  b.setAttribute('aria-pressed', String(l.on));
  b.classList.toggle('on', l.on);
  b.onclick = () => {
    l.on = !l.on;
    l.set(l.on);
    b.classList.toggle('on', l.on);
    b.setAttribute('aria-pressed', String(l.on));
  };
  return b;
}));

/* ---------- Clicking buildings and rooms ---------- */
const ray = new THREE.Raycaster();
const pick = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || mode !== 'orbit') return;
  if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5 || e.button !== 0) return;
  const r = canvas.getBoundingClientRect();
  pick.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(pick, camera);
  const floorKey = VIEWS.find((v) => v.id === currentView)?.floor;
  if (floorKey) {
    if (!ray.ray.intersectPlane(groundPlane, hit)) return;
    const room = FLOORS[floorKey].rooms.find((rm) => hit.x > rm.x0 && hit.x < rm.x1 && hit.z > rm.z0 && hit.z < rm.z1);
    if (room) showTip(room.n, e.clientX, e.clientY);
    return;
  }
  const oldHit = ray.intersectObject(world.oldB, true)[0];
  const newHit = ray.intersectObject(world.newB, true)[0];
  if (oldHit && (!newHit || oldHit.distance < newHit.distance)) setView('ob_gf');
  else if (newHit) setView('nb_1');
});
let tipTimer;
function showTip(text, x, y) {
  const t = $('tip');
  t.textContent = text;
  t.hidden = false;
  t.style.left = `${x}px`;
  t.style.top = `${y}px`;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

/* ---------- Main loop ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Centre the scene in the space beside the side panel.
  if (w > 760 && !walkActive) camera.setViewOffset(w, h, -120, 0, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  panoCam.aspect = w / h;
  panoCam.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const northEl = $('compass');
const northDir = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(NORTH_YAW_DEG)), 0, -Math.cos(THREE.MathUtils.degToRad(NORTH_YAW_DEG)));
const camDir = new THREE.Vector3();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  if (mode === 'pano') {
    updatePanoCam();
    renderer.render(panoScene, panoCam);
    return;
  }
  if (tween) {
    tween.t = Math.min(tween.t + dt / tween.dur, 1);
    const e = easeInOut(tween.t);
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (tween.t >= 1) tween = null;
  }
  if (walkActive) {
    updateWalk(dt);
    updateFollowCamera(dt);
  } else {
    controls.update();
  }
  updateWalkers(dt, time);
  updateTraffic(dt);
  world.flag.userData.wave(time);
  online.update(dt);
  sendPosition(time);
  camera.getWorldDirection(camDir);
  const heading = Math.atan2(camDir.x, -camDir.z) - Math.atan2(northDir.x, -northDir.z);
  northEl.style.transform = `rotate(${-heading}rad)`;
  updateLabels();
  renderer.render(scene, camera);
});

/* ---------- Site settings from the admin page ---------- */
const SETTING_FOR_LAYER = { people: 'showStudents', cars: 'showVehicles', labels: 'showLabels', wire: 'showWireframe' };
function applySettings(raw) {
  const settings = cleanSettings(raw);
  activeWalkers = settings.npcCount;
  for (const layer of layers) {
    const allowed = settings[SETTING_FOR_LAYER[layer.id]];
    const wasHidden = layer.button.hidden;
    layer.button.hidden = !allowed;
    let on = layer.on;
    if (!allowed) on = false;
    else if (wasHidden) on = layer.startsOn;
    if (on !== layer.on || !allowed) {
      layer.on = on;
      layer.set(on);
      layer.button.classList.toggle('on', on);
      layer.button.setAttribute('aria-pressed', String(on));
    }
  }
}

/* ---------- Accounts and other students ---------- */
let backend = null;
let profile = null;
let campus = null;
let lastSent = { at: -10, key: '' };
const online = createOnline({ scene, camera, canvas, avatar, bubbleRoot: $('bubbles'), isWalking: () => walkActive });

async function refreshPassportCount() {
  if (!backend) return;
  try {
    const count = await backend.passportCount();
    $('passport-count').textContent = `Passports issued: ${count}`;
  } catch {
    $('passport-count').textContent = '';
  }
}
function setOnlineCount(count) {
  const el = $('online-count');
  el.hidden = !count;
  el.textContent = `${count} online`;
}
function sendPosition(time) {
  if (!campus || !profile) return;
  const p = avatar.position;
  const key = walkActive ? `${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)},${avatar.rotation.y.toFixed(2)}` : lastSent.key;
  const changed = key !== lastSent.key;
  // Up to ten updates a second while moving, plus a slow update so late joiners catch up.
  if ((changed && time - lastSent.at > 0.1) || (walkPositionKnown && time - lastSent.at > 2)) {
    campus.sendMove({ id: profile.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), r: +avatar.rotation.y.toFixed(2) });
    lastSent = { at: time, key };
    walkPositionKnown = true;
  }
}
let walkPositionKnown = false;

async function enterCampus(next) {
  profile = next;
  setFigureLook(avatar, profile, { backpack: true });
  online.setSelf(profile);
  $('btn-account').textContent = profile.name;
  $('btn-account').classList.add('signed-in');
  refreshPassportCount();
  try {
    campus = await backend.joinCampus(profile, {
      onUsers: (list) => { setOnlineCount(online.setUsers(list)); refreshPassportCount(); },
      onMove: (move) => online.applyMove(move),
      onError: () => toast('Live campus connection was lost.'),
    });
  } catch {
    toast('Could not join the live campus.');
  }
}
async function leaveCampus() {
  await campus?.leave();
  campus = null;
  profile = null;
  walkPositionKnown = false;
  online.clear();
  setOnlineCount(0);
  setFigureLook(avatar, DEFAULT_LOOK, { backpack: true });
  $('btn-account').textContent = 'Log in / Register';
  $('btn-account').classList.remove('signed-in');
  refreshPassportCount();
}

let accountUI = null;
$('btn-account').onclick = () => {
  if (accountUI) accountUI.open();
  else toast('Accounts are not set up on this site yet.');
};
(async () => {
  try {
    backend = await createBackend();
    if (!backend) { $('passport-count').textContent = ''; return; }
    accountUI = createAccountUI({
      backend,
      getProfile: () => profile,
      onSignedIn: (next, isNew) => {
        enterCampus(next);
        toast(isNew ? `Welcome, ${next.name}! Your Student Passport is ready.` : `Welcome back, ${next.name}!`);
      },
      onSignedOut: () => { leaveCampus(); toast('Logged out.'); },
      onLookSaved: (saved) => {
        profile = saved;
        setFigureLook(avatar, saved, { backpack: true });
        online.setSelf(saved);
        $('btn-account').textContent = saved.name;
        campus?.update(saved);
        toast('Character saved.');
      },
    });
    backend.getSettings().then((s) => { if (s) applySettings(s); }).catch(() => {});
    backend.onSettingsChange(applySettings);
    const existing = await backend.getSession();
    if (existing) enterCampus(existing);
    else refreshPassportCount();
  } catch {
    $('passport-count').textContent = '';
    toast('Accounts could not be loaded right now.');
  }
})();

/* ---------- Start ---------- */
camera.position.copy(fitCamera(VIEWS[0].cam, VIEWS[0].target));
controls.target.set(...VIEWS[0].target);
applyTheme('day');
setView('overview', false);
renderPassport();
updateWalkers(0, 0);
updateTraffic(0);
$('loading').remove();

// Exposed for automated checks.
window.__ccc = { applySettings, get activeWalkers() { return activeWalkers; }, legMesh, layers, stick, online, sendPosition, get campus() { return campus; }, get profile() { return profile; }, get backend() { return backend; }, camera, controls, renderer, scene, world, avatar, keys, get mode() { return mode; }, get game() { return game; }, COLLIDERS, setView, selectLocation, stepWalk: updateWalk, stepCamera: updateFollowCamera, look, floorHeight, stopTween: () => { tween = null; } };
