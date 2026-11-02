import type { ReactNode } from 'react';
import type { Profile } from '../../types/character';

export type Tab = 'dashboard' | 'users' | 'settings';

const icon = (path: ReactNode) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>;

export const TABS: { id: Tab; name: string; icon: ReactNode }[] = [
  { id: 'dashboard', name: 'Dashboard', icon: icon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>) },
  { id: 'users', name: 'Users', icon: icon(<><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M16 4.5a4 4 0 0 1 0 7" /><path d="M19 15a7 7 0 0 1 3 6" /></>) },
  { id: 'settings', name: 'Settings', icon: icon(<><path d="M4 7h10" /><path d="M18 7h2" /><circle cx="16" cy="7" r="2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="8" cy="17" r="2" /></>) },
];

interface AdminSidebarProps {
  tab: Tab;
  profile: Profile;
  open: boolean;
  onTab: (tab: Tab) => void;
  onClose: () => void;
  onLogOut: () => void;
}

export function AdminSidebar({ tab, profile, open, onTab, onClose, onLogOut }: AdminSidebarProps) {
  return (
    <>
      <aside id="sidebar" className={open ? 'open' : undefined}>
        <div className="brand"><span className="brand-mark">CCC</span><span>Campus Admin</span></div>
        <nav id="tabs" aria-label="Admin sections">
          {TABS.map((t) => (
            <button key={t.id} data-tab={t.id} className={tab === t.id ? 'on' : undefined} aria-current={tab === t.id ? 'page' : undefined} onClick={() => onTab(t.id)}>
              {t.icon}{t.name}
            </button>
          ))}
        </nav>
        <div className="me">
          <div className="me-who">
            <span className="me-avatar" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="me-text"><span id="me-name" title={profile.name}>{profile.name}</span><small>Administrator</small></span>
          </div>
          <a className="side-link" href="/">Back to campus</a>
          <button id="logout" className="side-link" onClick={onLogOut}>Log out</button>
        </div>
      </aside>
      {open && <button id="sidebar-backdrop" aria-label="Close menu" onClick={onClose} />}
    </>
  );
}
