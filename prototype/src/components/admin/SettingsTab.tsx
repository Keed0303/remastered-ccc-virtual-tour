import { type FormEvent, useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { Backend, SiteSettings } from '../../types/backend';
import { DEFAULT_SETTINGS, NPC_MAX } from '../../utils/campusData';
import { cleanSettings } from '../../utils/validation';

type FlagKey = 'showWireframe' | 'showStudents' | 'showVehicles' | 'showLabels';
const SWITCHES: { key: FlagKey; id: string; name: string; note: string }[] = [
  { key: 'showWireframe', id: 'set-wireframe', name: 'Wireframe button', note: 'Lets visitors switch on the wireframe view' },
  { key: 'showStudents', id: 'set-students', name: 'Students (NPCs)', note: 'Walking students. Real logged-in players stay visible' },
  { key: 'showVehicles', id: 'set-vehicles', name: 'Vehicles', note: 'Traffic on the streets' },
  { key: 'showLabels', id: 'set-labels', name: 'Labels', note: 'Campus place labels. Name bubbles stay visible' },
];

export function SettingsTab({ backend }: { backend: Backend }) {
  const toast = useToast();
  const [flags, setFlags] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [npc, setNpc] = useState(String(DEFAULT_SETTINGS.npcCount));

  const show = (raw: unknown) => {
    const clean = cleanSettings(raw);
    setFlags(clean);
    setNpc(String(clean.npcCount));
  };

  useEffect(() => {
    let active = true;
    backend.getSettings()
      .then((s) => { if (active) show(s); })
      .catch((err: Error) => toast(err.message || 'Live data could not be loaded.'));
    return () => { active = false; };
  }, [backend, toast]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const count = Number(npc);
    if (!Number.isInteger(count) || count < 0 || count > NPC_MAX) { toast(`Number of NPCs must be 0 to ${NPC_MAX}.`); return; }
    try {
      show(await backend.saveSettings({ ...flags, npcCount: count }));
      toast('Settings saved.');
    } catch (err) {
      toast((err as Error).message);
    }
  };

  return (
    <>
      <h2>Site settings</h2>
      <p className="muted">These apply to every visitor. Open campus pages update right away.</p>
      <form id="settings-form" className="settings" onSubmit={submit}>
        {SWITCHES.map((s) => (
          <label key={s.id} className="switch-row">
            <span><b>{s.name}</b><small>{s.note}</small></span>
            <input id={s.id} type="checkbox" checked={flags[s.key]} onChange={(e) => setFlags({ ...flags, [s.key]: e.target.checked })} />
          </label>
        ))}
        <div className="npc-row">
          <label htmlFor="set-npc"><b>Number of NPCs</b><small>0 to {NPC_MAX}. Higher numbers can slow down phones</small></label>
          <div>
            <input id="set-npc-range" type="range" min="0" max={NPC_MAX} step="1" aria-label="Number of NPCs" value={npc} onChange={(e) => setNpc(e.target.value)} />
            <input id="set-npc" type="number" min="0" max={NPC_MAX} step="1" value={npc} onChange={(e) => setNpc(e.target.value)} />
          </div>
        </div>
        <button className="btn primary" type="submit">Save settings</button>
      </form>
    </>
  );
}
