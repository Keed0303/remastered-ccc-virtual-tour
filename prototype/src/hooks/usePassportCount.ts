import { useCallback, useEffect, useState } from 'react';
import type { Backend } from '../types/backend';

// The number of accounts on the site. Null means it is still loading, and -1 means unavailable.
export function usePassportCount(backend: Backend | null, unavailable: boolean) {
  const [count, setCount] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!backend) return;
    try {
      setCount(await backend.passportCount());
    } catch {
      setCount(-1);
    }
  }, [backend]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (unavailable) setCount(-1); }, [unavailable]);

  return { count, refresh };
}
