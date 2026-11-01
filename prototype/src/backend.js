// Accounts and live presence. Supabase in production, with a local stand-in for development.
const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In development, adding ?demo to the address uses the local stand-in even when keys exist.
const forceDemo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
export const backendMode = forceDemo ? 'demo' : URL_ && KEY ? 'supabase' : import.meta.env.DEV ? 'demo' : 'none';

const toProfile = (row) => row && {
  id: row.id,
  name: row.display_name,
  gender: row.gender,
  skin: row.skin_color,
  hair: row.hair_color,
  role: row.role,
};
// What other students may see. The role stays out of live presence.
const publicProfile = ({ id, name, gender, skin, hair }) => ({ id, name, gender, skin, hair });
const fromSettingsRow = (row) => ({ showWireframe: row.show_wireframe, showStudents: row.show_students, showVehicles: row.show_vehicles, showLabels: row.show_labels, npcCount: row.npc_count });
const toSettingsRow = (s) => ({ show_wireframe: s.showWireframe, show_students: s.showStudents, show_vehicles: s.showVehicles, show_labels: s.showLabels, npc_count: s.npcCount, updated_at: new Date().toISOString() });
const toRow = (p) => ({ display_name: p.name, gender: p.gender, skin_color: p.skin, hair_color: p.hair });

function friendlyError(error) {
  const text = error?.message || '';
  if (/invalid login/i.test(text)) return 'That email or password is not correct.';
  if (/already registered|already exists/i.test(text)) return 'That email already has an account. Try logging in.';
  if (/email not confirmed/i.test(text)) return 'Please confirm your email first, using the link we sent you.';
  if (/rate limit|too many/i.test(text)) return 'Too many attempts. Please wait a moment and try again.';
  if (/password/i.test(text)) return text;
  return 'Something went wrong. Please check your connection and try again.';
}

async function supabaseBackend() {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(URL_, KEY);

  // User management runs on the server, which checks the admin role on every request.
  async function adminCall(body) {
    const { data, error } = await client.functions.invoke('admin-users', { body });
    if (error) {
      let message = 'The request could not be completed.';
      try { message = (await error.context.json()).error || message; } catch { /* Keep the general message. */ }
      throw new Error(message);
    }
    return data;
  }

  async function profileFor(user) {
    const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw new Error(friendlyError(error));
    return toProfile(data);
  }

  return {
    mode: 'supabase',
    async getSession() {
      const { data } = await client.auth.getSession();
      return data.session ? profileFor(data.session.user) : null;
    },
    async signUp({ email, password, profile }) {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: toRow(profile), emailRedirectTo: location.origin } });
      if (error) throw new Error(friendlyError(error));
      // With email confirmation on, Supabase hides duplicates by returning a user with no identities.
      if (data.user && data.user.identities?.length === 0) throw new Error('That email already has an account. Try logging in.');
      if (!data.session) return { needsConfirm: true };
      return { profile: await profileFor(data.user) };
    },
    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendlyError(error));
      return profileFor(data.user);
    },
    async signOut() {
      await client.auth.signOut();
    },
    async updateProfile(profile) {
      const { data, error } = await client.from('profiles').update(toRow(profile)).eq('id', profile.id).select().single();
      if (error) throw new Error(friendlyError(error));
      return toProfile(data);
    },
    async passportCount() {
      const { data, error } = await client.rpc('passport_count');
      if (error) throw error;
      return Number(data);
    },
    async joinCampus(profile, { onUsers, onMove, onError }) {
      await client.realtime.setAuth();
      const channel = client.channel('campus', { config: { private: true, presence: { key: profile.id }, broadcast: { self: false } } });
      channel.on('presence', { event: 'sync' }, () => {
        onUsers(Object.values(channel.presenceState()).map((metas) => metas[0]));
      });
      channel.on('broadcast', { event: 'move' }, ({ payload }) => onMove(payload));
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track(publicProfile(profile));
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError?.(status);
      });
      return {
        sendMove: (move) => channel.send({ type: 'broadcast', event: 'move', payload: move }),
        update: (next) => channel.track(publicProfile(next)),
        leave: () => client.removeChannel(channel),
      };
    },
    async getSettings() {
      const { data, error } = await client.from('app_settings').select('*').eq('id', true).maybeSingle();
      if (error) throw error;
      return data ? fromSettingsRow(data) : null;
    },
    onSettingsChange(callback) {
      const channel = client.channel('settings-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, ({ new: row }) => callback(fromSettingsRow(row)))
        .subscribe();
      return () => client.removeChannel(channel);
    },
    async saveSettings(settings) {
      const { data, error } = await client.from('app_settings').update(toSettingsRow(settings)).eq('id', true).select().single();
      if (error) throw new Error(/row|permission/i.test(error.message) ? 'Admin permission is required.' : friendlyError(error));
      return fromSettingsRow(data);
    },
    // Watches who is online without appearing in the list.
    async watchOnline(callback) {
      await client.realtime.setAuth();
      const channel = client.channel('campus', { config: { private: true } });
      channel.on('presence', { event: 'sync' }, () => {
        callback(Object.values(channel.presenceState()).map((metas) => metas[0]));
      });
      channel.subscribe();
      return () => client.removeChannel(channel);
    },
    async adminListUsers() {
      return (await adminCall({ action: 'list' })).users;
    },
    adminCreateUser: (user) => adminCall({ action: 'create', ...user }),
    adminUpdateUser: (user) => adminCall({ action: 'update', ...user }),
    adminDeleteUser: (id) => adminCall({ action: 'delete', id }),
  };
}

// Local stand-in for development and tests. Tabs share accounts through browser storage,
// and passwords are never stored.
function demoBackend() {
  const ACCOUNTS = 'ccc-demo-accounts';
  const SESSION = 'ccc-demo-session';
  const read = (store, key, fallback) => {
    try { return JSON.parse(store.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const accounts = () => read(localStorage, ACCOUNTS, {});
  const saveAccounts = (a) => localStorage.setItem(ACCOUNTS, JSON.stringify(a));
  const SETTINGS = 'ccc-demo-settings';
  const settingsBus = new BroadcastChannel('ccc-demo-settings');
  const emailOf = (id) => {
    const all = accounts();
    return Object.keys(all).find((k) => all[k].id === id);
  };

  return {
    mode: 'demo',
    async getSession() {
      const email = read(sessionStorage, SESSION, null);
      return email ? accounts()[email] ?? null : null;
    },
    async signUp({ email, profile }) {
      const all = accounts();
      const key = email.toLowerCase();
      if (all[key]) throw new Error('That email already has an account. Try logging in.');
      // In the demo only, the first account becomes the admin so the page can be tried.
      const created = { ...profile, id: crypto.randomUUID(), role: Object.keys(all).length ? 'student' : 'admin', createdAt: new Date().toISOString() };
      all[key] = created;
      saveAccounts(all);
      sessionStorage.setItem(SESSION, JSON.stringify(key));
      return { profile: created };
    },
    async signIn({ email }) {
      const key = email.toLowerCase();
      const found = accounts()[key];
      if (!found) throw new Error('That email or password is not correct.');
      sessionStorage.setItem(SESSION, JSON.stringify(key));
      return found;
    },
    async signOut() {
      sessionStorage.removeItem(SESSION);
    },
    async updateProfile(profile) {
      const all = accounts();
      const key = Object.keys(all).find((k) => all[k].id === profile.id);
      if (key) all[key] = profile;
      saveAccounts(all);
      return profile;
    },
    async passportCount() {
      return Object.keys(accounts()).length;
    },
    async joinCampus(profile, { onUsers, onMove }) {
      const bus = new BroadcastChannel('ccc-demo-campus');
      const seen = new Map();
      let me = profile;
      const publish = () => onUsers([me, ...[...seen.values()].map((s) => s.user)]);
      bus.onmessage = ({ data }) => {
        if (data.type === 'hello' || data.type === 'here') {
          const isNew = !seen.has(data.user.id);
          seen.set(data.user.id, { user: data.user, at: Date.now() });
          if (data.type === 'hello') bus.postMessage({ type: 'here', user: me });
          if (isNew || data.type === 'hello') publish();
        } else if (data.type === 'bye') {
          seen.delete(data.id);
          publish();
        } else if (data.type === 'move') {
          onMove(data.move);
        }
      };
      const beat = setInterval(() => {
        bus.postMessage({ type: 'here', user: me });
        let changed = false;
        for (const [id, s] of seen) if (Date.now() - s.at > 6000) { seen.delete(id); changed = true; }
        if (changed) publish();
      }, 2000);
      const bye = () => bus.postMessage({ type: 'bye', id: me.id });
      addEventListener('pagehide', bye);
      bus.postMessage({ type: 'hello', user: me });
      publish();
      return {
        sendMove: (move) => bus.postMessage({ type: 'move', move }),
        update: (next) => { me = next; bus.postMessage({ type: 'hello', user: me }); publish(); },
        leave: () => { bye(); removeEventListener('pagehide', bye); clearInterval(beat); bus.close(); },
      };
    },
    async getSettings() {
      return read(localStorage, SETTINGS, null);
    },
    onSettingsChange(callback) {
      const handler = ({ data }) => callback(data);
      settingsBus.addEventListener('message', handler);
      return () => settingsBus.removeEventListener('message', handler);
    },
    async saveSettings(settings) {
      const me = await this.getSession();
      if (me?.role !== 'admin') throw new Error('Admin permission is required.');
      localStorage.setItem(SETTINGS, JSON.stringify(settings));
      settingsBus.postMessage(settings);
      return settings;
    },
    async watchOnline(callback) {
      const bus = new BroadcastChannel('ccc-demo-campus');
      const seen = new Map();
      const publish = () => callback([...seen.values()].map((s) => s.user));
      bus.onmessage = ({ data }) => {
        if (data.type === 'hello' || data.type === 'here') { seen.set(data.user.id, { user: data.user, at: Date.now() }); publish(); }
        else if (data.type === 'bye') { seen.delete(data.id); publish(); }
      };
      const prune = setInterval(() => {
        for (const [id, s] of seen) if (Date.now() - s.at > 6000) seen.delete(id);
        publish();
      }, 2000);
      publish();
      return () => { clearInterval(prune); bus.close(); };
    },
    async adminListUsers() {
      const me = await this.getSession();
      if (me?.role !== 'admin') throw new Error('Admin permission is required.');
      return Object.entries(accounts()).map(([email, p]) => ({ ...p, email, confirmed: true, lastSignIn: p.createdAt, createdAt: p.createdAt }));
    },
    async adminCreateUser({ email, name, gender, skin, hair, role }) {
      const me = await this.getSession();
      if (me?.role !== 'admin') throw new Error('Admin permission is required.');
      const all = accounts();
      const key = email.toLowerCase();
      if (all[key]) throw new Error('That email already has an account.');
      all[key] = { id: crypto.randomUUID(), name, gender, skin, hair, role, createdAt: new Date().toISOString() };
      saveAccounts(all);
    },
    async adminUpdateUser({ id, email, name, gender, skin, hair, role }) {
      const me = await this.getSession();
      if (me?.role !== 'admin') throw new Error('Admin permission is required.');
      if (id === me.id && role === 'student') throw new Error('You cannot remove your own admin role.');
      const all = accounts();
      const oldKey = emailOf(id);
      if (!oldKey) throw new Error('User not found.');
      const next = { ...all[oldKey], name, gender, skin, hair, role };
      delete all[oldKey];
      all[email.toLowerCase()] = next;
      saveAccounts(all);
      if (id === me.id) sessionStorage.setItem(SESSION, JSON.stringify(email.toLowerCase()));
    },
    async adminDeleteUser(id) {
      const me = await this.getSession();
      if (me?.role !== 'admin') throw new Error('Admin permission is required.');
      if (id === me.id) throw new Error('You cannot delete your own account.');
      const all = accounts();
      delete all[emailOf(id)];
      saveAccounts(all);
    },
  };
}

export async function createBackend() {
  if (backendMode === 'supabase') return supabaseBackend();
  if (backendMode === 'demo') return demoBackend();
  return null;
}
