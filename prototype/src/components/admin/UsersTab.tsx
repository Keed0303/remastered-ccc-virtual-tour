import { useState } from 'react';
import type { AdminUser, Backend } from '../../types/backend';
import type { Profile } from '../../types/character';
import { DeleteUserDialog } from './DeleteUserDialog';
import { UserDialog } from './UserDialog';

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never');

interface UsersTabProps { backend: Backend; me: Profile; users: AdminUser[]; reload: () => Promise<void> }

export function UsersTab({ backend, me, users, reload }: UsersTabProps) {
  const [search, setSearch] = useState('');
  // Undefined means closed, and null means creating a new user.
  const [editing, setEditing] = useState<AdminUser | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const q = search.trim().toLowerCase();
  const shown = users.filter((u) => !q || u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));

  return (
    <>
      <div className="section-head">
        <h2>Users</h2>
        <button id="user-new" className="btn primary" onClick={() => setEditing(null)}>Create user</button>
      </div>
      <input id="user-search" type="search" placeholder="Search name or email" aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Gender</th><th>Joined</th><th>Last login</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody id="user-rows">
            {shown.map((u) => (
              <tr key={u.id}>
                <td className="name">{u.name}{u.id === me.id && <span className="you">(you)</span>}</td>
                <td className="email">{u.email || ''}</td>
                <td data-label="Role"><span className={`pill ${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Student'}</span></td>
                <td data-label="Gender">{u.gender === 'female' ? 'Female' : 'Male'}</td>
                <td data-label="Joined">{formatDate(u.createdAt)}</td>
                <td data-label="Last login">{formatDate(u.lastSignIn)}</td>
                <td className="actions-cell">
                  <div className="row-actions">
                    <button className="btn ghost small" aria-label={`Edit ${u.name}`} onClick={() => setEditing(u)}>Edit</button>
                    {u.id !== me.id && <button className="btn ghost small" aria-label={`Delete ${u.name}`} onClick={() => setDeleting(u)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p id="users-empty" className="muted" hidden={shown.length > 0}>No users found.</p>
      {editing !== undefined && <UserDialog backend={backend} user={editing} isSelf={editing?.id === me.id} onClose={() => setEditing(undefined)} onSaved={reload} />}
      {deleting && <DeleteUserDialog backend={backend} user={deleting} onClose={() => setDeleting(null)} onDeleted={reload} />}
    </>
  );
}
