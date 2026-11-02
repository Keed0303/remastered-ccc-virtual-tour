import { useEffect, useRef, useState } from 'react';
import type { CampusScene } from '../scene/CampusScene';
import type { Backend, CampusConnection } from '../types/backend';
import type { Profile } from '../types/character';
import { DEFAULT_LOOK } from '../utils/campusData';

interface PresenceOptions { onUsersChanged: () => void; onError: (message: string) => void }

// Joins the live campus while logged in. Joins and leaves run one at a time, because
// the realtime client reuses a channel that has not finished closing.
export function useCampusPresence(scene: CampusScene | null, backend: Backend | null, profile: Profile | null, options: PresenceOptions) {
  const [onlineCount, setOnlineCount] = useState(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const connection = useRef<CampusConnection | null>(null);
  const latest = useRef(options);
  useEffect(() => { latest.current = options; });
  const profileId = profile?.id;
  const current = useRef(profile);
  current.current = profile;

  useEffect(() => {
    const joining = current.current;
    if (!scene || !backend || !joining || !profileId) return undefined;
    let stopped = false;
    let joined: CampusConnection | null = null;
    queue.current = queue.current.then(async () => {
      if (stopped) return;
      try {
        joined = await backend.joinCampus(joining, {
          onUsers: (list) => {
            if (stopped) return;
            setOnlineCount(scene.online.setUsers(list));
            latest.current.onUsersChanged();
          },
          onMove: (move) => { if (!stopped) scene.online.applyMove(move); },
          onError: () => latest.current.onError('Live campus connection was lost.'),
        });
        if (stopped) return;
        connection.current = joined;
        scene.online.setConnection(joined);
      } catch {
        latest.current.onError('Could not join the live campus.');
      }
    });
    return () => {
      stopped = true;
      connection.current = null;
      scene.online.clear();
      scene.setPlayerLook(DEFAULT_LOOK);
      setOnlineCount(0);
      queue.current = queue.current.then(() => joined?.leave()).catch(() => {});
    };
  }, [scene, backend, profileId]);

  // A changed name or look also reaches other students.
  useEffect(() => {
    if (!scene || !profile) return;
    scene.setPlayerLook(profile);
    scene.online.setSelf(profile);
    connection.current?.update(profile);
  }, [scene, profile]);

  return onlineCount;
}
