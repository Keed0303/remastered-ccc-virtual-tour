import type { Ref } from 'react';

// OnlinePlayers adds and moves the bubbles here, because they change position every frame.
export function NameBubbles({ ref }: { ref: Ref<HTMLDivElement> }) {
  return <div id="bubbles" ref={ref} aria-hidden="true" />;
}
