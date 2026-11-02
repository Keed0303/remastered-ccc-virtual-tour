import * as THREE from 'three';
import type { FloorKey } from '../types/campus';
import { FLOORS } from '../utils/campusData';
import type { World } from './world/buildWorld';

interface PickingOptions {
  canvas: HTMLCanvasElement;
  camera: THREE.Camera;
  world: World;
  signal: AbortSignal;
  isOrbit: () => boolean;
  currentFloor: () => FloorKey | null;
  onBuilding: (viewId: 'ob_gf' | 'nb_1') => void;
  onRoom: (name: string, x: number, y: number) => void;
}

// A click without a drag opens a building, or names a room on the floor plan.
export function enablePicking({ canvas, camera, world, signal, isOrbit, currentFloor, onBuilding, onRoom }: PickingOptions) {
  const ray = new THREE.Raycaster();
  const pick = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let downAt: [number, number] | null = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; }, { signal });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || !isOrbit()) return;
    if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5 || e.button !== 0) return;
    const r = canvas.getBoundingClientRect();
    pick.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pick, camera);
    const floorKey = currentFloor();
    if (floorKey) {
      if (!ray.ray.intersectPlane(groundPlane, hit)) return;
      const room = FLOORS[floorKey].rooms.find((rm) => hit.x > rm.x0 && hit.x < rm.x1 && hit.z > rm.z0 && hit.z < rm.z1);
      if (room) onRoom(room.n, e.clientX, e.clientY);
      return;
    }
    const oldHit = ray.intersectObject(world.oldB, true)[0];
    const newHit = ray.intersectObject(world.newB, true)[0];
    if (oldHit && (!newHit || oldHit.distance < newHit.distance)) onBuilding('ob_gf');
    else if (newHit) onBuilding('nb_1');
  }, { signal });
}
