import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Vec3 } from '../types/campus';

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

interface Tween { t: number; dur: number; p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3 }

// The orbit camera, and the smooth flights between saved views.
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(42, 1, 1, 1600);
  readonly controls: OrbitControls;
  private tween: Tween | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const controls = new OrbitControls(this.camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 8;
    controls.maxDistance = 340;
    this.controls = controls;
  }

  // Portrait screens need the camera further back to fit the same width.
  fit(pos: Vec3, target: Vec3) {
    const scale = Math.min(2.2, Math.max(1, 1.25 / (innerWidth / innerHeight)));
    return new THREE.Vector3(...pos).sub(new THREE.Vector3(...target)).multiplyScalar(scale).add(new THREE.Vector3(...target));
  }

  flyTo(pos: Vec3, target: Vec3, dur = 1.25, fit = true) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) dur = 0.01;
    this.tween = { t: 0, dur, p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: fit ? this.fit(pos, target) : new THREE.Vector3(...pos), t1: new THREE.Vector3(...target) };
  }

  jumpTo(pos: Vec3, target: Vec3) {
    this.camera.position.copy(this.fit(pos, target));
    this.controls.target.set(...target);
  }

  stopTween() {
    this.tween = null;
  }

  update(dt: number) {
    const { tween } = this;
    if (!tween) return;
    tween.t = Math.min(tween.t + dt / tween.dur, 1);
    const e = easeInOut(tween.t);
    this.camera.position.lerpVectors(tween.p0, tween.p1, e);
    this.controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (tween.t >= 1) this.tween = null;
  }

  dispose() {
    this.controls.dispose();
  }
}
