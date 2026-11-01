import type { Look, Swatch } from '../../types/character';
import { HAIR_SWATCHES, SKIN_SWATCHES } from '../../utils/campusData';
import { isHexColor } from '../../utils/validation';
import { CharacterPreview } from './CharacterPreview';

interface CharacterCustomizerProps {
  title: string;
  showGender: boolean;
  finishLabel: string;
  backLabel: string;
  look: Look;
  busy: boolean;
  onLook: (look: Look) => void;
  onBack: () => void;
  onFinish: () => void;
}

interface ColorPickerProps { id: string; customId: string; colors: Swatch[]; value: string; onPick: (color: string) => void }

function ColorPicker({ id, customId, colors, value, onPick }: ColorPickerProps) {
  return (
    <>
      <div id={id} className="swatches">
        {colors.map((c) => {
          const on = value.toLowerCase() === c.value.toLowerCase();
          return <button key={c.value} type="button" className={`swatch${on ? ' on' : ''}`} style={{ background: c.value }} title={c.name} aria-label={c.name} aria-pressed={on} onClick={() => onPick(c.value)} />;
        })}
      </div>
      <label className="custom-color">Custom<input id={customId} type="color" value={value} onChange={(e) => { if (isHexColor(e.target.value)) onPick(e.target.value); }} /></label>
    </>
  );
}

export function CharacterCustomizer({ title, showGender, finishLabel, backLabel, look, busy, onLook, onBack, onFinish }: CharacterCustomizerProps) {
  return (
    <section id="step-customize">
      <h2 id="customize-title">{title}</h2>
      <div className="customize">
        <CharacterPreview look={look} />
        <div className="pickers">
          {showGender && (
            <div id="custom-gender-row">
              <div className="field-label">Gender</div>
              <div id="custom-gender" className="choice-row">
                {(['female', 'male'] as const).map((g) => (
                  <button key={g} type="button" data-gender={g} className={look.gender === g ? 'on' : undefined} aria-pressed={look.gender === g} onClick={() => onLook({ ...look, gender: g })}>
                    {g === 'female' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="field-label">Skin color</div>
          <ColorPicker id="skin-swatches" customId="skin-custom" colors={SKIN_SWATCHES} value={look.skin} onPick={(skin) => onLook({ ...look, skin })} />
          <div className="field-label">Hair color</div>
          <ColorPicker id="hair-swatches" customId="hair-custom" colors={HAIR_SWATCHES} value={look.hair} onPick={(hair) => onLook({ ...look, hair })} />
        </div>
      </div>
      <div className="dialog-actions">
        <button id="customize-back" type="button" className="ghost" onClick={onBack}>{backLabel}</button>
        <button id="customize-finish" type="button" className="primary" disabled={busy} onClick={onFinish}>{finishLabel}</button>
      </div>
    </section>
  );
}
