import type { Ref } from 'react';
import type { BuildingLabel } from '../../types/campus';
import type { GameState } from '../../types/game';
import { BUILDING_LABELS, LOCATIONS } from '../../utils/campusData';

interface CampusLabelsProps {
  ref: Ref<HTMLDivElement>;
  game: GameState;
  selectedId?: string;
  onLocation: (id: string) => void;
  onBuilding: (label: BuildingLabel) => void;
}

// React renders the buttons. LabelProjector moves them every frame through their style.
export function CampusLabels({ ref, game, selectedId, onLocation, onBuilding }: CampusLabelsProps) {
  return (
    <div id="labels" ref={ref} aria-hidden="false">
      {LOCATIONS.map((l) => {
        const classes = ['pin', game.stamps.includes(l.id) && 'stamped', selectedId === l.id && 'active'].filter(Boolean).join(' ');
        return <button key={l.id} data-label-id={l.id} className={classes} onClick={() => onLocation(l.id)}>{l.name}</button>;
      })}
      {BUILDING_LABELS.map((b) => (
        <button key={b.id} data-label-id={b.id} className="pin big" onClick={() => onBuilding(b)}>{b.name}</button>
      ))}
    </div>
  );
}
