import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BADGES, COLLIDERS, FLOORS, LOCATIONS, NORTH_YAW_DEG, RANKS, THEMES, VIEWS, WALK_BOUNDS } from './data.js';
import { FIGURE, buildWorld, createAvatar, figureArm, figureBody, figureLeg } from './world.js';

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
const WALKERS = 46;
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
  walkers.forEach((w, i) => {
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
function renderPassport() {
  const lvl = Math.floor(game.xp / XP_PER_LEVEL);
  $('level').textContent = `Level ${lvl + 1} ${RANKS[Math.min(lvl, RANKS.length - 1)]}`;
  $('xp').textContent = `${game.xp} XP`;
  $('xp-bar').style.width = `${((game.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100}%`;
  const stamps = $('stamps');
  stamps.replaceChildren(...LOCATIONS.map((l) => {
    const b = document.createElement('button');
    const got = game.stamps.includes(l.id);
    b.className = `stamp${got ? ' got' : ''}`;
    b.title = l.name;
    b.setAttribute('aria-label', `${l.name}${got ? ', stamped' : ''}`);
    b.textContent = got ? '★' : LOCATIONS.indexOf(l) + 1;
    b.onclick = () => selectLocation(l.id, true);
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
const buildingLabels = [
  { id: '_old', name: 'Old Building', pos: [14, 13, -14], view: 'ob_gf', big: true },
  { id: '_new', name: 'New Building (JMC)', pos: [22, 22, 71], view: 'nb_1', big: true },
  { id: '_hall', name: 'CCC Blue-Roof Building', pos: [24, 17, 28], big: true, note: 'Part of CCC. Its rooms are not mapped in this sample yet.' },
];
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
buildingLabels.forEach((b) => addLabel(b, () => (b.view ? setView(b.view) : toast(b.note))));
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
  controls.enabled = true;
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
const avatar = createAvatar();
avatar.visible = false;
scene.add(avatar);
const keys = new Set();
let walkActive = false;
let nearby = null;
let walkPhase = 0;
function startWalk() {
  walkActive = true;
  mode = 'walk';
  setView('overview', false);
  avatar.visible = true;
  avatar.position.set(29, 0, -116);
  avatar.rotation.y = Math.PI;
  document.body.classList.add('walking');
  camera.clearViewOffset();
  $('walk-ui').hidden = false;
  $('card').hidden = true;
  selected = null;
  flyTo([29, 10, -131], [29, 1.2, -116], 1, false);
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
  resize();
  setView('overview');
}
$('btn-walk').onclick = () => (walkActive ? stopWalk() : startWalk());
$('walk-exit').onclick = stopWalk;
addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    if (mode === 'pano') closePano();
    else if (walkActive) stopWalk();
    else if (selected) { $('card').hidden = true; selected = null; }
    return;
  }
  if (!walkActive || mode !== 'walk') return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
    keys.add(e.code);
    e.preventDefault();
  }
  if (e.code === 'KeyE' && nearby) {
    selected = nearby;
    renderCard(nearby);
    checkIn(nearby.id);
  }
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
document.querySelectorAll('.walk-pad button').forEach((b) => {
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); keys.add(b.dataset.k); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => keys.delete(b.dataset.k)));
});
const R = 0.5;
const blocked = (x, z) => COLLIDERS.some((c) => x > c.x0 - R && x < c.x1 + R && z > c.z0 - R && z < c.z1 + R);
const fwd = new THREE.Vector3();
function updateWalk(dt) {
  let ax = 0, az = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) az += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) az -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ax -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ax += 1;
  const before = avatar.position.clone();
  const moving = ax || az;
  if (moving) {
    camera.getWorldDirection(fwd);
    fwd.y = 0; fwd.normalize();
    const rx = -fwd.z, rz = fwd.x;
    let dx = fwd.x * az + rx * ax, dz = fwd.z * az + rz * ax;
    const len = Math.hypot(dx, dz);
    dx /= len; dz /= len;
    const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 11 : 5.6) * dt;
    const b = WALK_BOUNDS;
    const nx = THREE.MathUtils.clamp(avatar.position.x + dx * speed, b.x0, b.x1);
    const nz = THREE.MathUtils.clamp(avatar.position.z + dz * speed, b.z0, b.z1);
    if (!blocked(nx, avatar.position.z)) avatar.position.x = nx;
    if (!blocked(avatar.position.x, nz)) avatar.position.z = nz;
    avatar.rotation.y = Math.atan2(dx, dz);
    walkPhase += dt * 11;
  }
  const swing = moving ? Math.sin(walkPhase) * 0.5 : 0;
  avatar.userData.legL.rotation.x = swing;
  avatar.userData.legR.rotation.x = -swing;
  avatar.userData.armL.rotation.x = -swing;
  avatar.userData.armR.rotation.x = swing;
  const dp = avatar.position.clone().sub(before);
  camera.position.add(dp);
  controls.target.add(dp);

  nearby = null;
  let best = 7.5;
  for (const l of LOCATIONS) {
    if (l.floor) continue;
    const d = Math.hypot(l.pos[0] - avatar.position.x, l.pos[2] - avatar.position.z);
    if (d < best) { best = d; nearby = l; }
  }
  const prompt = $('prompt');
  prompt.hidden = !nearby;
  if (nearby) prompt.textContent = game.stamps.includes(nearby.id) ? `${nearby.name} · Stamped ★` : `${nearby.name} · Press E to check in`;
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
  if (walkActive) updateWalk(dt);
  controls.update();
  updateWalkers(dt, time);
  updateTraffic(dt);
  world.flag.userData.wave(time);
  camera.getWorldDirection(camDir);
  const heading = Math.atan2(camDir.x, -camDir.z) - Math.atan2(northDir.x, -northDir.z);
  northEl.style.transform = `rotate(${-heading}rad)`;
  updateLabels();
  renderer.render(scene, camera);
});

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
window.__ccc = { camera, controls, renderer, scene, world, avatar, keys, get mode() { return mode; }, get game() { return game; }, COLLIDERS, setView, selectLocation, stepWalk: updateWalk, stopTween: () => { tween = null; } };
