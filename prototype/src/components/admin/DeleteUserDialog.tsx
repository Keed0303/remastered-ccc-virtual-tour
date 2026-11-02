import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { AdminUser, Backend } from '../../types/backend';
import { Dialog } from '../common/Dialog';

interface DeleteUserDialogProps { backend: Backend; user: AdminUser; onClose: () => void; onDeleted: () => Promise<void> }

export function DeleteUserDialog({ backend, user, onClose, onDeleted }: DeleteUserDialogProps) {
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await backend.adminDeleteUser(user.id);
      onClose();
      toast('User deleted.');
      await onDeleted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog id="delete-dialog" aria-labelledby="delete-title" isOpen onDismiss={onClose}>
      <h2 id="delete-title">Delete this user?</h2>
      <p>This permanently deletes <strong id="delete-name">{user.name} ({user.email || 'no email'})</strong> and their login. It can't be undone.</p>
      <p id="delete-error" className="error" role="alert" hidden={!error}>{error}</p>
      <div className="actions">
        <button id="delete-cancel" type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        <button id="delete-confirm" type="button" className="btn danger" disabled={busy} onClick={confirm}>Delete user</button>
      </div>
    </Dialog>
  );
}
