import { type RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPlayerFigure, disposeFigure, setFigureLook } from '../scene/characters/figure';
import type { Look } from '../types/character';

// A small turning 3D preview of the character being customized.
export function useCharacterPreview(canvasRef: RefObject<HTMLCanvasElement | null>, look: Look) {
  const figureRef = useRef<THREE.Group | null>(null);
  const firstLook = useRef(look);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || 260, canvas.clientHeight || 260, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b7bdc4', 1.5));
    const sun = new THREE.DirectionalLight('#ffffff', 2.2);
    sun.position.set(2, 4, 4);
    scene.add(sun);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    cam.position.set(0, 1.25, 5.1);
    cam.lookAt(0, 1.02, 0);
    const figure = createPlayerFigure(firstLook.current);
    figureRef.current = figure;
    scene.add(figure);
    let raf = 0;
    const frame = (t: number) => {
      figure.rotation.y = Math.sin(t / 1400) * 0.75;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      figureRef.current = null;
      disposeFigure(figure);
      renderer.dispose();
    };
  }, [canvasRef]);

  useEffect(() => {
    firstLook.current = look;
    if (figureRef.current) setFigureLook(figureRef.current, look);
  }, [look]);
}
