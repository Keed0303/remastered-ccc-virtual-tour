import * as THREE from 'three';
import { THEMES } from '../utils/campusData';
import type { World } from './world/buildWorld';

// Sky, fog, and lights for each time of day.
export class Environment {
  private hemi = new THREE.HemisphereLight('#ffffff', '#c5ccc4', 1);
  private sun = new THREE.DirectionalLight('#ffffff', 3);
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const { sun, hemi } = this;
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 1, far: 480 });
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.25;
    sun.target.position.set(24, 0, -15);
    scene.add(hemi, sun, sun.target);
  }

  apply(id: string, world: World) {
    const t = THEMES.find((x) => x.id === id);
    if (!t) return;
    this.scene.background = new THREE.Color(t.sky);
    this.scene.fog = new THREE.Fog(t.fog, 240, 760);
    this.sun.color.set(t.sun);
    this.sun.intensity = t.sunI;
    this.sun.position.set(...t.pos).add(this.sun.target.position);
    this.hemi.intensity = t.hemi;
    this.hemi.groundColor.set(t.hemiG);
    world.glassMat.emissiveIntensity = t.glow;
    world.lampMat.emissiveIntensity = t.lamps;
  }

  dispose() {
    this.sun.shadow.dispose();
    this.sun.dispose();
    this.hemi.dispose();
    this.scene.remove(this.hemi, this.sun, this.sun.target);
  }
}
