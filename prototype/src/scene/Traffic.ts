import * as THREE from 'three';
import { disposeObject } from './dispose';

interface Lane { axis: 'x' | 'z'; fixed: number; dir: number; range: [number, number] }

const CAR_COLORS = ['#f4f6f8', '#c43d3d', '#3c6ec2', '#30343c', '#e0b23f', '#f4f6f8'];
const LANES: Lane[] = [
  { axis: 'z', fixed: -14.2, dir: 1, range: [-220, 210] }, { axis: 'z', fixed: -9.6, dir: -1, range: [-220, 210] },
  { axis: 'x', fixed: -56, dir: 1, range: [-110, 155] }, { axis: 'x', fixed: -52.4, dir: -1, range: [-110, 155] },
  { axis: 'z', fixed: 61, dir: 1, range: [-48, 210] }, { axis: 'z', fixed: 65, dir: -1, range: [-48, 210] },
  { axis: 'x', fixed: 97.5, dir: -1, range: [-110, 155] },
];

function makeCar(color: string, tricycle: boolean) {
  const g = new THREE.Group();
  const m = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, flatShading: true });
  const add = (w: number, h: number, d: number, c: string, y: number, z = 0) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m(c));
    o.position.set(0, y, z);
    o.castShadow = true;
    g.add(o);
  };
  if (tricycle) {
    add(1.3, 0.9, 2.2, color, 0.8); add(1.4, 0.1, 2.5, '#22262c', 1.85); add(1.2, 0.7, 1.4, '#253244', 1.35, -0.2);
  } else {
    add(1.8, 0.7, 4.2, color, 0.65); add(1.55, 0.6, 2.2, '#253244', 1.25, -0.2);
  }
  return g;
}

export class Traffic {
  readonly group = new THREE.Group();
  private cars: { car: THREE.Group; lane: Lane; p: number; v: number }[] = [];

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    LANES.forEach((lane, i) => {
      for (let k = 0; k < 2; k++) {
        const car = makeCar(CAR_COLORS[(i + k) % CAR_COLORS.length], (i + k) % 3 === 0);
        if (lane.axis === 'z') car.rotation.y = lane.dir > 0 ? 0 : Math.PI;
        else car.rotation.y = lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        this.group.add(car);
        this.cars.push({ car, lane, p: lane.range[0] + Math.random() * (lane.range[1] - lane.range[0]), v: 7 + Math.random() * 4 });
      }
    });
  }

  update(dt: number) {
    for (const t of this.cars) {
      t.p += t.v * dt * t.lane.dir;
      const [a, b] = t.lane.range;
      if (t.p > b) t.p = a; else if (t.p < a) t.p = b;
      if (t.lane.axis === 'z') t.car.position.set(t.lane.fixed, 0, t.p);
      else t.car.position.set(t.p, 0, t.lane.fixed);
    }
  }

  dispose() {
    this.group.removeFromParent();
    disposeObject(this.group);
  }
}
