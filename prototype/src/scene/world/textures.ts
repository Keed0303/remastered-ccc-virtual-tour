import * as THREE from 'three';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTex(w: number, h: number, draw: DrawFn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function signPlane(w: number, h: number, draw: DrawFn, pxW = 1024) {
  const tex = canvasTex(pxW, Math.round((pxW * h) / w), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8 }));
  return m;
}
