import { useRef } from 'react';
import { useCharacterPreview } from '../../hooks/useCharacterPreview';
import type { Look } from '../../types/character';

export function CharacterPreview({ look }: { look: Look }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useCharacterPreview(canvas, look);
  return <canvas id="char-preview" ref={canvas} width={260} height={280} aria-label="Preview of your character" />;
}
