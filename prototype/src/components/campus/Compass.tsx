import type { Ref } from 'react';

export function Compass({ ref }: { ref: Ref<HTMLDivElement> }) {
  return <div id="compass" ref={ref} title="Approximate north"><i /><span>N</span></div>;
}
