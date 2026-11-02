import { useCallback, useState } from 'react';
import type { AdminUser, Backend } from '../types/backend';
import { useToast } from './useToast';

export function useAdminUsers(backend: Backend | null) {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  const load = useCallback(async () => {
    if (!backend) return;
    try {
      setUsers(await backend.adminListUsers());
    } catch (err) {
      toast((err as Error).message);
    }
  }, [backend, toast]);

  // Nothing an admin loaded may stay in the page for the next person.
  const clear = useCallback(() => setUsers(null), []);

  return { users, load, clear };
}
