import { VIEWS } from '../../utils/campusData';

export function Views({ view, onView }: { view: string; onView: (id: string) => void }) {
  return (
    <nav id="views" aria-label="Views">
      {VIEWS.map((v) => <button key={v.id} data-id={v.id} className={v.id === view ? 'on' : undefined} onClick={() => onView(v.id)}>{v.name}</button>)}
    </nav>
  );
}
