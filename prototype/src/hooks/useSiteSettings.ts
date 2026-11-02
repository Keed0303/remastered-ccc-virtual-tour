import { useEffect, useRef, useState } from 'react';
import type { Backend, SiteSettings, Unsubscribe } from '../types/backend';
import { cleanSettings } from '../utils/validation';

// Current site settings, kept live. Null until the first settings arrive.
export function useSiteSettings(backend: Backend | null) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!backend) return undefined;
    let stopped = false;
    let stop: Unsubscribe | undefined;
    const apply = (raw: unknown) => { if (!stopped) setSettings(cleanSettings(raw)); };
    backend.getSettings().then((s) => { if (s) apply(s); }).catch(() => {});
    // One at a time, because the realtime client reuses a channel that is still closing.
    queue.current = queue.current.then(() => { if (!stopped) stop = backend.onSettingsChange(apply); });
    return () => {
      stopped = true;
      queue.current = queue.current.then(() => stop?.()).catch(() => {});
    };
  }, [backend]);

  return settings;
}
