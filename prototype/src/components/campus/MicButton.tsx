import type { MicState } from '../../types/voice';

const LABELS: Record<MicState, string> = { off: 'Turn on mic', asking: 'Waiting for mic…', live: 'Mute mic', muted: 'Unmute mic' };

export function MicButton({ state, onToggle }: { state: MicState; onToggle: () => void }) {
  return (
    <button
      id="btn-mic"
      data-mic={state}
      disabled={state === 'asking'}
      aria-pressed={state === 'live'}
      // Dropping focus keeps Space for jumping.
      onClick={(e) => { e.currentTarget.blur(); onToggle(); }}
    >
      {LABELS[state]}
    </button>
  );
}
