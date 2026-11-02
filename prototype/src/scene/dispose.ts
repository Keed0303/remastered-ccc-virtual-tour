import * as THREE from 'three';

// Releases the GPU memory behind an object tree: geometry, materials, and their textures.
export function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  root.traverse((o) => {
    if (o instanceof THREE.InstancedMesh) o.dispose();
    if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
    }
    if (o instanceof THREE.Light && 'dispose' in o) (o as THREE.Light & { dispose(): void }).dispose();
  });
  for (const m of materials) disposeMaterial(m);
}

export function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
  material.dispose();
}
