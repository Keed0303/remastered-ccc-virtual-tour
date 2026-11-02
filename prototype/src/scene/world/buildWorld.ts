import * as THREE from 'three';
import type { FloorKey } from '../../types/campus';
import { FLOORS } from '../../utils/campusData';
import { disposeObject } from '../dispose';
import { buildBlueRoofBlock } from './blueRoofBlock';
import { buildFloor } from './floors';
import { buildGround, createFlag } from './ground';
import { buildNewBuilding } from './newBuilding';
import { buildOldBuilding } from './oldBuilding';

export function buildWorld(scene: THREE.Scene) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, flatShading: true });
  const glassMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.25, emissive: new THREE.Color('#ffd58a'), emissiveIntensity: 0 });
  const lampMat = new THREE.MeshStandardMaterial({ vertexColors: true, emissive: new THREE.Color('#ffdd99'), emissiveIntensity: 0, roughness: 0.4 });
  const ground = buildGround(mat, lampMat);
  const oldB = buildOldBuilding(mat, glassMat);
  const newB = buildNewBuilding(mat, glassMat);
  const hall = buildBlueRoofBlock(mat, glassMat);
  const floors = {} as Record<FloorKey, THREE.Group>;
  for (const key of Object.keys(FLOORS) as FloorKey[]) { floors[key] = buildFloor(key, mat); scene.add(floors[key]); }
  scene.add(ground, oldB, newB, hall);
  const flag = createFlag();
  scene.add(flag.mesh);
  const dispose = () => {
    for (const root of [ground, oldB, newB, hall, flag.mesh, ...Object.values(floors)]) {
      root.removeFromParent();
      disposeObject(root);
    }
  };
  return { mat, glassMat, lampMat, ground, oldB, newB, hall, floors, flag, dispose };
}

export type World = ReturnType<typeof buildWorld>;
