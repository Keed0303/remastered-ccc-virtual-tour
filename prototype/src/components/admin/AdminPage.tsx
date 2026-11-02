// Admin page. The server enforces every permission. This check only decides what to show.
import { useEffect, useRef, useState } from 'react';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import '../../styles/admin.css';
import type { Unsubscribe } from '../../types/backend';
import type { Profile, PublicProfile } from '../../types/character';
import { ToastProvider } from '../common/Toasts';
import { AdminGate } from './AdminGate';
import { DashboardTab } from './DashboardTab';
import { SettingsTab } from './SettingsTab';
import { UsersTab } from './UsersTab';

type Tab = 'dashboard' | 'users' | 'settings';
const TABS: { id: Tab; name: string }[] = [{ id: 'dashboard', name: 'Dashboard' }, { id: 'users', name: 'Users' }, { id: 'settings', name: 'Settings' }];

function Admin() {
  const toast = useToast();
  const { backend, profile, setProfile, status } = useAuth();
  const { users, load, clear } = useAdminUsers(backend);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [online, setOnline] = useState<PublicProfile[] | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin || !backend) return undefined;
    void load();
    let stopped = false;
    let stop: Unsubscribe | undefined;
    // One at a time, because the realtime client reuses a channel that is still closing.
    queue.current = queue.current.then(async () => {
      if (stopped) return;
      try {
        stop = await backend.watchOnline((list) => {
          if (!stopped) setOnline(list.filter((u): u is PublicProfile => !!u && typeof (u as PublicProfile).name === 'string'));
        });
      } catch (err) {
        toast((err as Error).message || 'Live data could not be loaded.');
      }
    });
    return () => {
      stopped = true;
      setOnline(null);
      queue.current = queue.current.then(() => stop?.()).catch(() => {});
    };
  }, [isAdmin, backend, load, toast]);

  const logOut = async () => {
    await backend?.signOut();
    clear();
    setProfile(null);
  };

  if (!isAdmin || !backend || !profile) {
    return <AdminGate status={status} backend={backend} profile={profile} onSignedIn={setProfile as (p: Profile | null) => void} onLogOut={logOut} />;
  }

  return (
    <div id="app">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">CCC</span><span>Campus Admin</span></div>
        <nav id="tabs" aria-label="Admin sections">
          {TABS.map((t) => <button key={t.id} data-tab={t.id} className={tab === t.id ? 'on' : undefined} onClick={() => setTab(t.id)}>{t.name}</button>)}
        </nav>
        <div className="me">
          <span id="me-name">{profile.name}</span>
          <a className="btn ghost small" href="/">Campus</a>
          <button id="logout" className="btn ghost small" onClick={logOut}>Log out</button>
        </div>
      </header>
      <main>
        <p id="demo-banner" className="demo" hidden={backend.mode !== 'demo'}>Demo mode: changes stay in this browser and don't touch Supabase.</p>
        <section id="tab-dashboard" hidden={tab !== 'dashboard'}><DashboardTab users={users} online={online} /></section>
        <section id="tab-users" hidden={tab !== 'users'}><UsersTab backend={backend} me={profile} users={users ?? []} reload={load} /></section>
        <section id="tab-settings" hidden={tab !== 'settings'}><SettingsTab backend={backend} /></section>
        <p className="legal">© 2026 Manuel Kyd Thomas Nagpala. All rights reserved.</p>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <title>CCC Campus Admin</title>
      <meta name="robots" content="noindex" />
      <Admin />
    </ToastProvider>
  );
}
