import { THEMES } from '../../utils/campusData';

export function ThemePicker({ theme, onTheme }: { theme: string; onTheme: (id: string) => void }) {
  return (
    <section id="themes" aria-label="Time of day">
      {THEMES.map((t) => <button key={t.id} data-id={t.id} className={t.id === theme ? 'on' : undefined} onClick={() => onTheme(t.id)}>{t.name}</button>)}
    </section>
  );
}
