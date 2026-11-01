// Admin page. The server enforces every permission. This check only decides what to show.
import { createBackend } from './backend.js';
import { DEFAULT_LOOK, DEFAULT_SETTINGS, NPC_MAX, cleanSettings, isHexColor } from './data.js';

const $ = (id) => document.getElementById(id);
let backend = null;
let me = null;
let users = [];
let editing = null;
let deleting = null;
let stopOnline = null;

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.textContent = text;
  $('toast').append(el);
  setTimeout(() => el.remove(), 3200);
}
function showError(id, text) {
  $(id).textContent = text || '';
  $(id).hidden = !text;
}
function showGate(which) {
  for (const id of ['gate-loading', 'gate-login', 'gate-denied', 'gate-unavailable']) $(id).hidden = id !== which;
  $('app').hidden = true;
  $('gate').hidden = false;
}
const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never');

/* ---------- Dashboard ---------- */
function renderStats() {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  $('stat-total').textContent = users.filter((u) => u.role === 'student').length;
  $('stat-new').textContent = users.filter((u) => new Date(u.createdAt).getTime() >= week).length;
  $('stat-admins').textContent = users.filter((u) => u.role === 'admin').length;
  $('stat-gender').textContent = `${users.filter((u) => u.gender === 'female').length} / ${users.filter((u) => u.gender === 'male').length}`;
  $('stat-unconfirmed').textContent = users.filter((u) => !u.confirmed).length;
}
function renderOnline(list) {
  const clean = list.filter((u) => u && typeof u.name === 'string');
  $('stat-online').textContent = clean.length;
  $('online-list').replaceChildren(...clean.map((u) => {
    const li = document.createElement('li');
    li.textContent = u.name.slice(0, 24);
    return li;
  }));
}

/* ---------- Users ---------- */
function cell(label, text, className) {
  const td = document.createElement('td');
  if (label) td.dataset.label = label;
  if (className) td.className = className;
  if (text !== undefined) td.textContent = text;
  return td;
}
function renderUsers() {
  const q = $('user-search').value.trim().toLowerCase();
  const shown = users.filter((u) => !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  $('users-empty').hidden = shown.length > 0;
  $('user-rows').replaceChildren(...shown.map((u) => {
    const tr = document.createElement('tr');
    const name = cell(null, u.name, 'name');
    if (u.id === me.id) {
      const you = document.createElement('span');
      you.className = 'you';
      you.textContent = '(you)';
      name.append(you);
    }
    const role = cell('Role');
    const pill = document.createElement('span');
    pill.className = `pill ${u.role}`;
    pill.textContent = u.role === 'admin' ? 'Admin' : 'Student';
    role.append(pill);

    const actions = cell(null, undefined, 'actions-cell');
    const box = document.createElement('div');
    box.className = 'row-actions';
    const edit = document.createElement('button');
    edit.className = 'btn ghost small';
    edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${u.name}`);
    edit.onclick = () => openUserDialog(u);
    box.append(edit);
    if (u.id !== me.id) {
      const del = document.createElement('button');
      del.className = 'btn ghost small';
      del.textContent = 'Delete';
      del.setAttribute('aria-label', `Delete ${u.name}`);
      del.onclick = () => openDelete(u);
      box.append(del);
    }
    actions.append(box);
    tr.append(
      name,
      cell(null, u.email || '', 'email'),
      role,
      cell('Gender', u.gender === 'female' ? 'Female' : 'Male'),
      cell('Joined', formatDate(u.createdAt)),
      cell('Last login', formatDate(u.lastSignIn)),
      actions,
    );
    return tr;
  }));
}
async function loadUsers() {
  try {
    users = await backend.adminListUsers();
    renderUsers();
    renderStats();
  } catch (err) {
    toast(err.message);
  }
}
function openUserDialog(user) {
  editing = user;
  showError('user-error', '');
  $('user-dialog-title').textContent = user ? `Edit ${user.name}` : 'Create user';
  $('u-name').value = user?.name ?? '';
  $('u-email').value = user?.email ?? '';
  $('u-password').value = '';
  $('u-password-label').textContent = user ? 'New password (leave blank to keep)' : 'Password';
  $('u-gender').value = user?.gender ?? 'female';
  $('u-role').value = user?.role ?? 'student';
  $('u-role').disabled = user?.id === me.id;
  $('u-skin').value = isHexColor(user?.skin) ? user.skin : DEFAULT_LOOK.skin;
  $('u-hair').value = isHexColor(user?.hair) ? user.hair : DEFAULT_LOOK.hair;
  $('user-dialog').showModal();
}
$('user-new').onclick = () => openUserDialog(null);
$('user-cancel').onclick = () => $('user-dialog').close();
$('user-search').oninput = renderUsers;
$('user-form').onsubmit = async (e) => {
  e.preventDefault();
  const fields = {
    name: $('u-name').value.trim(),
    email: $('u-email').value.trim(),
    gender: $('u-gender').value,
    role: $('u-role').value,
    skin: $('u-skin').value,
    hair: $('u-hair').value,
  };
  const password = $('u-password').value;
  if (fields.name.length < 2) { showError('user-error', 'Name must be 2 to 24 characters.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) { showError('user-error', 'Enter a valid email address.'); return; }
  if ((!editing || password) && password.length < 8) { showError('user-error', 'Use a password with at least 8 characters.'); return; }
  $('user-save').disabled = true;
  showError('user-error', '');
  try {
    if (editing) {
      if (password) fields.password = password;
      await backend.adminUpdateUser({ id: editing.id, ...fields });
      toast('User updated.');
    } else {
      await backend.adminCreateUser({ ...fields, password });
      toast('User created.');
    }
    $('u-password').value = '';
    $('user-dialog').close();
    await loadUsers();
  } catch (err) {
    showError('user-error', err.message);
  } finally {
    $('user-save').disabled = false;
  }
};
function openDelete(user) {
  deleting = user;
  $('delete-name').textContent = `${user.name} (${user.email || 'no email'})`;
  showError('delete-error', '');
  $('delete-dialog').showModal();
}
$('delete-cancel').onclick = () => $('delete-dialog').close();
$('delete-confirm').onclick = async () => {
  $('delete-confirm').disabled = true;
  try {
    await backend.adminDeleteUser(deleting.id);
    $('delete-dialog').close();
    toast('User deleted.');
    await loadUsers();
  } catch (err) {
    showError('delete-error', err.message);
  } finally {
    $('delete-confirm').disabled = false;
  }
};

/* ---------- Settings ---------- */
function renderSettings(raw) {
  const s = cleanSettings(raw);
  $('set-wireframe').checked = s.showWireframe;
  $('set-students').checked = s.showStudents;
  $('set-vehicles').checked = s.showVehicles;
  $('set-labels').checked = s.showLabels;
  $('set-npc').value = s.npcCount;
  $('set-npc-range').value = s.npcCount;
}
$('set-npc-range').oninput = (e) => { $('set-npc').value = e.target.value; };
$('set-npc').oninput = (e) => { $('set-npc-range').value = e.target.value; };
$('settings-form').onsubmit = async (e) => {
  e.preventDefault();
  const npc = Number($('set-npc').value);
  if (!Number.isInteger(npc) || npc < 0 || npc > NPC_MAX) { toast(`Number of NPCs must be 0 to ${NPC_MAX}.`); return; }
  try {
    const saved = await backend.saveSettings({
      showWireframe: $('set-wireframe').checked,
      showStudents: $('set-students').checked,
      showVehicles: $('set-vehicles').checked,
      showLabels: $('set-labels').checked,
      npcCount: npc,
    });
    renderSettings(saved);
    toast('Settings saved.');
  } catch (err) {
    toast(err.message);
  }
};

/* ---------- Page flow ---------- */
document.querySelectorAll('#tabs button').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('#tabs button').forEach((o) => o.classList.toggle('on', o === b));
    for (const name of ['dashboard', 'users', 'settings']) $(`tab-${name}`).hidden = name !== b.dataset.tab;
  };
});
async function logOut() {
  stopOnline?.();
  stopOnline = null;
  await backend.signOut();
  me = null;
  users = [];
  // Nothing an admin loaded may stay in the page for the next person.
  $('user-rows').replaceChildren();
  $('online-list').replaceChildren();
  for (const id of ['stat-total', 'stat-online', 'stat-new', 'stat-admins', 'stat-gender', 'stat-unconfirmed']) $(id).textContent = '–';
  $('user-search').value = '';
  showGate('gate-login');
}
$('logout').onclick = logOut;
$('denied-logout').onclick = logOut;

async function enter(profile) {
  if (!profile) { showGate('gate-login'); return; }
  if (profile.role !== 'admin') { showGate('gate-denied'); return; }
  me = profile;
  $('me-name').textContent = profile.name;
  $('demo-banner').hidden = backend.mode !== 'demo';
  $('gate').hidden = true;
  $('app').hidden = false;
  renderSettings(DEFAULT_SETTINGS);
  await loadUsers();
  try {
    renderSettings(await backend.getSettings());
    stopOnline = await backend.watchOnline(renderOnline);
  } catch (err) {
    toast(err.message || 'Live data could not be loaded.');
  }
}
$('gate-login').onsubmit = async (e) => {
  e.preventDefault();
  showError('gate-login-error', '');
  try {
    const profile = await backend.signIn({ email: $('admin-email').value.trim(), password: $('admin-password').value });
    $('admin-password').value = '';
    await enter(profile);
  } catch (err) {
    showError('gate-login-error', err.message);
  }
};

(async () => {
  try {
    backend = await createBackend();
    if (!backend) { showGate('gate-unavailable'); return; }
    await enter(await backend.getSession());
  } catch {
    showGate('gate-login');
  }
})();
