import type { LayerId } from '../../types/scene';
import { LAYERS, type LayerState } from '../../utils/layers';

export function LayerToggles({ layers, onToggle }: { layers: LayerState; onToggle: (id: LayerId) => void }) {
  return (
    <section id="toggles" aria-label="Layers">
      {LAYERS.map((l) => {
        const { on, allowed } = layers[l.id];
        return <button key={l.id} hidden={!allowed} className={on ? 'on' : undefined} aria-pressed={on} onClick={() => onToggle(l.id)}>{l.name}</button>;
      })}
    </section>
  );
}
