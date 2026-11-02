import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CampusScene } from '../scene/CampusScene';
import type { SceneEvents } from '../types/scene';

declare global {
  interface Window { __ccc?: CampusScene }
}

interface SceneRefs {
  host: RefObject<HTMLDivElement | null>;
  labels: RefObject<HTMLDivElement | null>;
  bubbles: RefObject<HTMLDivElement | null>;
  compass: RefObject<HTMLDivElement | null>;
}

// Creates the scene once the page's DOM exists, and releases it again on unmount.
export function useCampusScene(refs: SceneRefs, events: SceneEvents) {
  const [scene, setScene] = useState<CampusScene | null>(null);
  const latest = useRef(events);
  useLayoutEffect(() => { latest.current = events; });

  useEffect(() => {
    // The scene keeps one set of handlers, which always call the newest ones from React.
    const created = new CampusScene(
      { host: refs.host.current!, labels: refs.labels.current!, bubbles: refs.bubbles.current!, compass: refs.compass.current! },
      {
        onViewChange: (...a) => latest.current.onViewChange?.(...a),
        onModeChange: (...a) => latest.current.onModeChange?.(...a),
        onNearbyChange: (...a) => latest.current.onNearbyChange?.(...a),
        onRoomClick: (...a) => latest.current.onRoomClick?.(...a),
        onPanoError: () => latest.current.onPanoError?.(),
        onMouseLockChange: (...a) => latest.current.onMouseLockChange?.(...a),
        onEscape: () => latest.current.onEscape?.(),
        onCheckInKey: () => latest.current.onCheckInKey?.(),
        onSeatChange: (...a) => latest.current.onSeatChange?.(...a),
        onMicChange: (...a) => latest.current.onMicChange?.(...a),
        onMicError: (...a) => latest.current.onMicError?.(...a),
      },
    );
    created.start();
    setScene(created);
    // For automated checks in development only.
    if (import.meta.env.DEV) window.__ccc = created;
    return () => {
      setScene(null);
      created.dispose();
      if (import.meta.env.DEV) delete window.__ccc;
    };
  }, [refs.host, refs.labels, refs.bubbles, refs.compass]);

  return scene;
}
