import { type FormEvent, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { AdminUser, AdminUserFields, Backend } from '../../types/backend';
import type { Gender, Role } from '../../types/character';
import { DEFAULT_LOOK } from '../../utils/campusData';
import { isEmail, isHexColor } from '../../utils/validation';
import { Dialog } from '../common/Dialog';

interface UserDialogProps { backend: Backend; user: AdminUser | null; isSelf: boolean; onClose: () => void; onSaved: () => Promise<void> }

export function UserDialog({ backend, user, isSelf, onClose, onSaved }: UserDialogProps) {
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'female');
  const [role, setRole] = useState<Role>(user?.role ?? 'student');
  const [skin, setSkin] = useState(isHexColor(user?.skin) ? user.skin : DEFAULT_LOOK.skin);
  const [hair, setHair] = useState(isHexColor(user?.hair) ? user.hair : DEFAULT_LOOK.hair);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const fields: AdminUserFields = { name: name.trim(), email: email.trim(), gender, role, skin, hair };
    if (fields.name.length < 2) { setError('Name must be 2 to 24 characters.'); return; }
    if (!isEmail(fields.email)) { setError('Enter a valid email address.'); return; }
    if ((!user || password) && password.length < 8) { setError('Use a password with at least 8 characters.'); return; }
    setSaving(true);
    setError('');
    try {
      if (user) {
        await backend.adminUpdateUser({ id: user.id, ...fields, ...(password ? { password } : {}) });
        toast('User updated.');
      } else {
        await backend.adminCreateUser({ ...fields, password });
        toast('User created.');
      }
      onClose();
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog id="user-dialog" aria-labelledby="user-dialog-title" isOpen onDismiss={onClose}>
      <form id="user-form" onSubmit={submit}>
        <h2 id="user-dialog-title">{user ? `Edit ${user.name}` : 'Create user'}</h2>
        <p id="user-error" className="error" role="alert" hidden={!error}>{error}</p>
        <label>Name<input id="u-name" maxLength={24} required value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Email<input id="u-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label><span id="u-password-label">{user ? 'New password (leave blank to keep)' : 'Password'}</span><input id="u-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <div className="two">
          <label>Gender<select id="u-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}><option value="female">Female</option><option value="male">Male</option></select></label>
          <label>Role<select id="u-role" value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value as Role)}><option value="student">Student</option><option value="admin">Admin</option></select></label>
        </div>
        <div className="two">
          <label>Skin color<input id="u-skin" type="color" value={skin} onChange={(e) => setSkin(e.target.value)} /></label>
          <label>Hair color<input id="u-hair" type="color" value={hair} onChange={(e) => setHair(e.target.value)} /></label>
        </div>
        <div className="actions">
          <button id="user-cancel" type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button id="user-save" type="submit" className="btn primary" disabled={saving}>Save</button>
        </div>
      </form>
    </Dialog>
  );
}
