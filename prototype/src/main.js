// Temporary bridge: the scene runs from CampusScene while this file still owns the page's DOM.
// React components replace this file in the next phase.
import { createAccountUI } from './account.js';
import { CampusScene } from './scene/CampusScene';
import { BADGES, BUILDING_LABELS, DEFAULT_LOOK, LOCATIONS, RANKS, THEMES, VIEWS } from './utils/campusData';
import { createBackend } from './utils/backend';
import { cleanSettings } from './utils/validation';

const $ = (id) => document.getElementById(id);
let selected = null;

// The labels must exist before the scene starts looking for them.
for (const def of [...LOCATIONS, ...BUILDING_LABELS]) {
  const el = document.createElement('button');
  el.className = `pin${def.big ? ' big' : ''}`;
  el.dataset.labelId = def.id;
  el.textContent = def.name;
  el.onclick = () => {
    if (def.big) { if (def.view) campus.setView(def.view); else toast(def.note); }
    else selectLocation(def.id, true);
  };
  $('labels').append(el);
}

let walkNearby = null;
const campus = new CampusScene({ host: $('scene-host'), labels: $('labels'), bubbles: $('bubbles'), compass: $('compass') }, {
  onViewChange: (id) => {
    document.querySelectorAll('#views button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
  },
  onModeChange: (mode, walking) => {
    document.body.classList.toggle('walking', walking);
    document.body.classList.toggle('in-pano', mode === 'pano');
    $('walk-ui').hidden = !walking;
    $('pano-ui').hidden = mode !== 'pano';
    if (walking && mode === 'walk' && !wasWalking) { $('card').hidden = true; selected = null; }
    wasWalking = walking;
  },
  onNearbyChange: (l) => { walkNearby = l; renderPrompt(); },
  onRoomClick: showTip,
  onPanoError: () => toast('Could not load this 360° photo.'),
  onMouseLockChange: (locked) => document.body.classList.toggle('mouse-locked', locked),
  onEscape: () => { if (selected) { $('card').hidden = true; selected = null; } },
  onCheckInKey: () => checkInNearby(),
});
let wasWalking = false;
const { keys, stick } = campus.walk;
function refreshStamps() {
  document.querySelectorAll('[data-label-id]').forEach((el) => {
    el.classList.toggle('stamped', game.stamps.includes(el.dataset.labelId));
    el.classList.toggle('active', selected?.id === el.dataset.labelId);
  });
}
function renderPrompt() {
  const prompt = $('prompt');
  prompt.hidden = !walkNearby;
  $('btn-checkin').hidden = !walkNearby || game.stamps.includes(walkNearby.id);
  if (walkNearby) prompt.textContent = game.stamps.includes(walkNearby.id) ? `${walkNearby.name} · Stamped ★` : `${walkNearby.name} · ${matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'Tap Check in' : 'Press E to check in'}`;
}
function checkInNearby() {
  if (!walkNearby) return;
  campus.follow.releaseMouse();
  selected = walkNearby;
  renderCard(walkNearby);
  checkIn(walkNearby.id);
  renderPrompt();
}
function openPano(l) {
  $('pano-name').textContent = l.name;
  campus.openPano(l);
}
function selectLocation(id, fly) {
  const l = LOCATIONS.find((x) => x.id === id);
  selected = l;
  campus.focusLocation(l, fly);
  renderCard(l);
  refreshStamps();
}
$('card-close').onclick = () => { $('card').hidden = true; selected = null; refreshStamps(); };
$('views').replaceChildren(...VIEWS.map((v) => {
  const b = document.createElement('button');
  b.dataset.id = v.id;
  b.textContent = v.name;
  b.onclick = () => campus.chooseView(v.id);
  return b;
}));
$('pano-close').onclick = () => campus.closePano();
$('btn-walk').onclick = () => (campus.walking ? campus.stopWalk() : campus.startWalk());
$('walk-exit').onclick = () => campus.stopWalk();

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
  refreshStamps();
}
$('legal-link').onclick = () => $('legal-dialog').showModal();
$('reset').onclick = () => {
  game = { xp: 0, stamps: [], quiz: [], badges: [] };
  saveState();
  renderPassport();
  if (selected) renderCard(selected);
  toast('Progress reset');
};

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
function applyTheme(id) {
  campus.setTheme(id);
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
  { id: 'people', name: 'Students', on: true },
  { id: 'cars', name: 'Vehicles', on: true },
  { id: 'labels', name: 'Labels', on: true },
  { id: 'wire', name: 'Wireframe', on: false },
].map((l) => ({ ...l, set: (v) => campus.setLayer(l.id, v) }));
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

/* ---------- Site settings from the admin page ---------- */
const SETTING_FOR_LAYER = { people: 'showStudents', cars: 'showVehicles', labels: 'showLabels', wire: 'showWireframe' };
function applySettings(raw) {
  const settings = cleanSettings(raw);
  campus.setNpcCount(settings.npcCount);
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
let connection = null;
const online = campus.online;

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
async function enterCampus(next) {
  profile = next;
  campus.setPlayerLook(profile);
  online.setSelf(profile);
  $('btn-account').textContent = profile.name;
  $('btn-account').classList.add('signed-in');
  refreshPassportCount();
  try {
    connection = await backend.joinCampus(profile, {
      onUsers: (list) => { setOnlineCount(online.setUsers(list)); refreshPassportCount(); },
      onMove: (move) => online.applyMove(move),
      onError: () => toast('Live campus connection was lost.'),
    });
    online.setConnection(connection);
  } catch {
    toast('Could not join the live campus.');
  }
}
async function leaveCampus() {
  await connection?.leave();
  connection = null;
  profile = null;
  online.clear();
  setOnlineCount(0);
  campus.setPlayerLook(DEFAULT_LOOK);
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
        campus.setPlayerLook(saved);
        online.setSelf(saved);
        $('btn-account').textContent = saved.name;
        connection?.update(saved);
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

applyTheme('day');
document.querySelector('#views button').classList.add('on');
renderPassport();
refreshStamps();
$('loading').remove();
campus.start();
if (import.meta.env.DEV) window.__ccc = campus;
