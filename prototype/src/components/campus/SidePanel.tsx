import { Views } from './Views';

interface SidePanelProps {
  view: string;
  accountName: string | null;
  onView: (id: string) => void;
  onWalk: () => void;
  onAccount: () => void;
  onLegal: () => void;
}

export function SidePanel({ view, accountName, onView, onWalk, onAccount, onLegal }: SidePanelProps) {
  return (
    <aside id="side" className="panel-dark">
      <div className="brand"><span className="brand-mark">CCC</span><span>Campus 3D</span></div>
      <p className="eyebrow">City College of Calamba · Prototype</p>
      <h1>Explore the<br />campus in 3D.</h1>
      <p className="lede">Earn your Student Passport by visiting the places that make up CCC.</p>
      <Views view={view} onView={onView} />
      <div className="side-tools">
        <button id="btn-walk" className="primary" onClick={onWalk}>Explore on foot</button>
        <button id="btn-account" className={`account-btn${accountName ? ' signed-in' : ''}`} onClick={onAccount}>{accountName ?? 'Log in / Register'}</button>
      </div>
      <p className="hint" id="hint">Drag to rotate · Right-drag to pan · Scroll to zoom · Click a label</p>
      <button id="legal-link" className="legal-link" onClick={onLegal}>© 2026 Manuel Kyd Thomas Nagpala · Copyright</button>
    </aside>
  );
}
