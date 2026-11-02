import * as THREE from 'three';
import { BARRETO, BROSAS, BURGOS, SV_RIZAL, SV_RIZAL_NORTH, offsetPath, pathLength, pointAlong, type PathPoint } from '../utils/streets';
import { disposeObject } from './dispose';

interface Lane { path: PathPoint[]; length: number; cars: number }

const CAR_COLORS = ['#f4f6f8', '#c43d3d', '#3c6ec2', '#30343c', '#e0b23f', '#f4f6f8'];
// Each direction keeps to the right of its street.
const lane = (path: PathPoint[], side: number, cars: number): Lane => {
  const moved = offsetPath(path, side);
  return { path: moved, length: pathLength(moved), cars };
};
const LANES: Lane[] = [
  lane(SV_RIZAL.path, 2.2, 2), lane([...SV_RIZAL.path].reverse(), 2.2, 2),
  lane(SV_RIZAL_NORTH.path, 1.7, 1), lane([...SV_RIZAL_NORTH.path].reverse(), 1.7, 1),
  lane(BARRETO.path, 2, 3), lane([...BARRETO.path].reverse(), 2, 3),
  lane([...BROSAS.path].reverse(), 1.5, 2),
  lane(BURGOS.path, 2, 2),
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
      for (let k = 0; k < lane.cars; k++) {
        const car = makeCar(CAR_COLORS[(i + k) % CAR_COLORS.length], (i + k) % 3 === 0);
        this.group.add(car);
        this.cars.push({ car, lane, p: Math.random() * lane.length, v: 7 + Math.random() * 4 });
      }
    });
  }

  update(dt: number) {
    for (const t of this.cars) {
      t.p += t.v * dt;
      if (t.p > t.lane.length) t.p = 0;
      const { x, z, heading } = pointAlong(t.lane.path, t.p);
      t.car.position.set(x, 0, z);
      t.car.rotation.y = heading;
    }
  }

  dispose() {
    this.group.removeFromParent();
    disposeObject(this.group);
  }
}
