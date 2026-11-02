import type { AdminUser, Backend, SiteSettings } from '../../types/backend';
import type { Profile, PublicProfile } from '../../types/character';

type Accounts = Record<string, Profile>;
type BusMessage =
  | { type: 'hello' | 'here'; user: PublicProfile }
  | { type: 'bye'; id: string }
  | { type: 'move'; move: unknown }
  | { type: 'voice'; message: unknown };

const ACCOUNTS = 'ccc-demo-accounts';
const SESSION = 'ccc-demo-session';
const SETTINGS = 'ccc-demo-settings';

const read = <T>(store: Storage, key: string, fallback: T): T => {
  try { return (JSON.parse(store.getItem(key) ?? 'null') as T | null) ?? fallback; } catch { return fallback; }
};

// Local stand-in for development and tests. Tabs share accounts through browser storage,
// and passwords are never stored.
export function demoBackend(): Backend {
  const accounts = () => read<Accounts>(localStorage, ACCOUNTS, {});
  const saveAccounts = (a: Accounts) => localStorage.setItem(ACCOUNTS, JSON.stringify(a));
  const settingsBus = new BroadcastChannel('ccc-demo-settings');
  const emailOf = (id: string) => {
    const all = accounts();
    return Object.keys(all).find((k) => all[k].id === id);
  };
  const getSession = async () => {
    const email = read<string | null>(sessionStorage, SESSION, null);
    return email ? accounts()[email] ?? null : null;
  };
  const requireAdmin = async () => {
    const me = await getSession();
    if (me?.role !== 'admin') throw new Error('Admin permission is required.');
    return me;
  };

  return {
    mode: 'demo',
    getSession,
    async signUp({ email, profile }) {
      const all = accounts();
      const key = email.toLowerCase();
      if (all[key]) throw new Error('That email already has an account. Try logging in.');
      // In the demo only, the first account becomes the admin so the page can be tried.
      const created: Profile = { ...profile, id: crypto.randomUUID(), role: Object.keys(all).length ? 'student' : 'admin', createdAt: new Date().toISOString() };
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
    async joinCampus(profile, { onUsers, onMove, onVoice }) {
      const bus = new BroadcastChannel('ccc-demo-campus');
      const seen = new Map<string, { user: PublicProfile; at: number }>();
      let me = profile;
      const publish = () => onUsers([me, ...[...seen.values()].map((s) => s.user)]);
      bus.onmessage = ({ data }: MessageEvent<BusMessage>) => {
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
        } else if (data.type === 'voice') {
          onVoice(data.message);
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
        sendVoice: (message) => bus.postMessage({ type: 'voice', message }),
        update: (next) => { me = next; bus.postMessage({ type: 'hello', user: me }); publish(); },
        leave: () => { bye(); removeEventListener('pagehide', bye); clearInterval(beat); bus.close(); },
      };
    },
    async getSettings() {
      return read<SiteSettings | null>(localStorage, SETTINGS, null);
    },
    onSettingsChange(callback) {
      const handler = ({ data }: MessageEvent<SiteSettings>) => callback(data);
      settingsBus.addEventListener('message', handler);
      return () => settingsBus.removeEventListener('message', handler);
    },
    async saveSettings(settings) {
      await requireAdmin();
      localStorage.setItem(SETTINGS, JSON.stringify(settings));
      settingsBus.postMessage(settings);
      return settings;
    },
    async watchOnline(callback) {
      const bus = new BroadcastChannel('ccc-demo-campus');
      const seen = new Map<string, { user: PublicProfile; at: number }>();
      const publish = () => callback([...seen.values()].map((s) => s.user));
      bus.onmessage = ({ data }: MessageEvent<BusMessage>) => {
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
      await requireAdmin();
      return Object.entries(accounts()).map(([email, p]): AdminUser => ({ ...p, email, confirmed: true, lastSignIn: p.createdAt ?? null, createdAt: p.createdAt ?? '' }));
    },
    async adminCreateUser({ email, name, gender, skin, hair, role }) {
      await requireAdmin();
      const all = accounts();
      const key = email.toLowerCase();
      if (all[key]) throw new Error('That email already has an account.');
      all[key] = { id: crypto.randomUUID(), name, gender, skin, hair, role, createdAt: new Date().toISOString() };
      saveAccounts(all);
    },
    async adminUpdateUser({ id, email, name, gender, skin, hair, role }) {
      const me = await requireAdmin();
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
      const me = await requireAdmin();
      if (id === me.id) throw new Error('You cannot delete your own account.');
      const all = accounts();
      const key = emailOf(id);
      if (key) delete all[key];
      saveAccounts(all);
    },
  };
}
