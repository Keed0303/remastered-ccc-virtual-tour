import type { AdminUser } from '../../types/backend';
import type { PublicProfile } from '../../types/character';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function DashboardTab({ users, online }: { users: AdminUser[] | null; online: PublicProfile[] | null }) {
  const count = (test: (u: AdminUser) => boolean) => (users ? users.filter(test).length : '–');
  const weekAgo = Date.now() - WEEK;
  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        <article><span>Student accounts</span><strong id="stat-total">{count((u) => u.role === 'student')}</strong></article>
        <article><span>Online now</span><strong id="stat-online">{online ? online.length : '–'}</strong><small>Logged-in students only</small></article>
        <article><span>New in 7 days</span><strong id="stat-new">{count((u) => new Date(u.createdAt).getTime() >= weekAgo)}</strong></article>
        <article><span>Admins</span><strong id="stat-admins">{count((u) => u.role === 'admin')}</strong></article>
        <article><span>Female / Male</span><strong id="stat-gender">{users ? `${users.filter((u) => u.gender === 'female').length} / ${users.filter((u) => u.gender === 'male').length}` : '–'}</strong></article>
        <article><span>Email not confirmed</span><strong id="stat-unconfirmed">{count((u) => !u.confirmed)}</strong></article>
      </div>
      <h3>Online now</h3>
      <ul id="online-list" className="online-list">
        {online?.map((u, i) => <li key={u.id ?? i}>{u.name.slice(0, 24)}</li>)}
      </ul>
      <p id="online-empty" className="muted" hidden={online?.length !== 0}>No students are online right now.</p>
    </>
  );
}
