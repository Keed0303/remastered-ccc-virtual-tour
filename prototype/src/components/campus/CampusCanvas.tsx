import type { Ref } from 'react';

// CampusScene adds its own canvas here, so each mount gets a fresh WebGL context.
export function CampusCanvas({ ref }: { ref: Ref<HTMLDivElement> }) {
  return <div id="scene-host" ref={ref} />;
}
