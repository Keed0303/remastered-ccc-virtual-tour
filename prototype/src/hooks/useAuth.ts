import { useEffect, useState } from 'react';
import type { Backend } from '../types/backend';
import type { Profile } from '../types/character';
import { createBackend } from '../utils/backend';

export type AuthStatus = 'loading' | 'ready' | 'unavailable' | 'error';

// Finds the backend and restores any saved session.
export function useAuth() {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const found = await createBackend();
        if (!active) return;
        if (!found) { setStatus('unavailable'); return; }
        setBackend(found);
        const existing = await found.getSession();
        if (!active) return;
        setProfile(existing);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    })();
    return () => { active = false; };
  }, []);

  return { backend, profile, setProfile, status };
}
