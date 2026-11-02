import * as THREE from 'three';
import type { Gender } from '../types/character';
import { DEFAULT_SETTINGS, NPC_MAX } from '../utils/campusData';
import { FEMALE, FIGURE, figureArm, figureBody, figureLeg } from './characters/figure';
import { disposeObject } from './dispose';

const LOOKS: { skin: string; hair: string; gender: Gender }[] = [
  { skin: '#e0ac84', hair: '#1f1712', gender: 'male' },
  { skin: '#c98d63', hair: '#2d1c12', gender: 'female' },
  { skin: '#b97a52', hair: '#17120e', gender: 'male' },
  { skin: '#d9a47e', hair: '#3a2a1c', gender: 'female' },
];
const WALK_PATHS: [number, number][][] = [
  [[30, -116], [30, -62]], [[38, -62], [38, -116]], [[31, -62], [26, -51]], [[28, -112], [40, -112]],
  [[-6, -22], [-6, 48]], [[47, -49], [47, -41]], [[-5.8, 54], [-5.8, 88]], [[20, -59.5], [46, -59.5]],
];

// Walking students. Meshes are sized for the maximum, and only the active number is drawn.
export class Npcs {
  readonly group = new THREE.Group();
  active = DEFAULT_SETTINGS.npcCount;
  private material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true });
  private bodies: THREE.InstancedMesh[];
  private arms: THREE.InstancedMesh[];
  private legs: THREE.InstancedMesh[];
  private walkers = Array.from({ length: NPC_MAX }, (_, i) => ({
    path: WALK_PATHS[i % WALK_PATHS.length],
    t: Math.random(),
    speed: 0.012 + Math.random() * 0.016,
    dir: i % 2 ? 1 : -1,
    off: (Math.random() - 0.5) * 3.2,
    off2: (Math.random() - 0.5) * 3.2,
    phase: Math.random() * 6.28,
  }));
  private root = new THREE.Object3D();
  private limb = new THREE.Object3D();
  private limbMatrix = new THREE.Matrix4();

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    const perLook = Math.ceil(NPC_MAX / LOOKS.length);
    this.bodies = LOOKS.map((look) => this.instanced(figureBody(look), perLook));
    this.arms = LOOKS.map((look) => this.instanced(figureArm(look.skin), perLook * 2));
    this.legs = LOOKS.map((look) => this.instanced(figureLeg(look.gender === 'female' ? look.skin : undefined), perLook * 2));
  }

  private instanced(geo: THREE.BufferGeometry, count: number) {
    const mesh = new THREE.InstancedMesh(geo, this.material, count);
    mesh.castShadow = true;
    // Students spread across the campus, so the mesh is never culled as one block.
    mesh.frustumCulled = false;
    this.group.add(mesh);
    return mesh;
  }

  private setLimb(mesh: THREE.InstancedMesh, index: number, x: number, y: number, swing: number) {
    this.limb.position.set(x, y, 0);
    this.limb.rotation.set(swing, 0, 0);
    this.limb.updateMatrix();
    this.limbMatrix.multiplyMatrices(this.root.matrix, this.limb.matrix);
    mesh.setMatrixAt(index, this.limbMatrix);
  }

  update(dt: number, time: number) {
    const { root } = this;
    const counters = LOOKS.map(() => 0);
    for (let i = 0; i < this.active; i++) {
      const w = this.walkers[i];
      w.t += w.speed * dt * w.dir;
      if (w.t > 1 || w.t < 0) { w.dir *= -1; w.t = THREE.MathUtils.clamp(w.t, 0, 1); }
      const [a, b] = w.path;
      const x = a[0] + (b[0] - a[0]) * w.t + w.off, z = a[1] + (b[1] - a[1]) * w.t + w.off2;
      root.position.set(x, 0.02, z);
      root.rotation.set(0, Math.atan2((b[0] - a[0]) * w.dir, (b[1] - a[1]) * w.dir), 0);
      root.scale.setScalar(1.15);
      root.updateMatrix();
      const look = i % LOOKS.length;
      const n = counters[look]++;
      this.bodies[look].setMatrixAt(n, root.matrix);
      const swing = Math.sin(time * 5.5 + w.phase) * 0.6;
      const { shoulderX, hipX } = LOOKS[look].gender === 'female' ? FEMALE : FIGURE;
      this.setLimb(this.arms[look], n * 2, shoulderX, FIGURE.shoulderY, -swing);
      this.setLimb(this.arms[look], n * 2 + 1, -shoulderX, FIGURE.shoulderY, swing);
      this.setLimb(this.legs[look], n * 2, hipX, FIGURE.hipY, swing);
      this.setLimb(this.legs[look], n * 2 + 1, -hipX, FIGURE.hipY, -swing);
    }
    LOOKS.forEach((_, l) => {
      this.bodies[l].count = counters[l];
      this.arms[l].count = counters[l] * 2;
      this.legs[l].count = counters[l] * 2;
      this.legs[l].instanceMatrix.needsUpdate = true;
      this.bodies[l].instanceMatrix.needsUpdate = true;
      this.arms[l].instanceMatrix.needsUpdate = true;
    });
  }

  dispose() {
    this.group.removeFromParent();
    disposeObject(this.group);
  }
}
