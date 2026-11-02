import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Point = [number, number, number];

export const C = {
  white: '#f3f4f2', cream: '#ece7db', blue: '#1f62b8', blueDk: '#174a8c', sky: '#4b8fd6', roof: '#3f6db5', roofDk: '#5a7192',
  roofGrey: '#7f8ea3', brown: '#6f4f3f', slab: '#e7e9ea', asphalt: '#8d9298', pale: '#dfe4e9', paleRoof: '#ccd3da',
  terra: '#b8795f', paver: '#ded7c8', paver2: '#c9c3b6', stone: '#a79c8b', green: '#6fa86a', green2: '#8cbf7c', green3: '#54935c',
  trunk: '#7a6248', dark: '#2a3442', step: '#c0704f', wood: '#a7835c', tile: '#f0ece2',
};

// Collects coloured geometry and merges it into one mesh, which keeps draw calls low.
export class Batch {
  parts: THREE.BufferGeometry[] = [];

  add(g: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
    const geo = g.index ? g.toNonIndexed() : g;
    geo.deleteAttribute('uv');
    const col = new THREE.Color(color);
    const n = geo.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    if (!geo.attributes.normal) geo.computeVertexNormals();
    this.parts.push(geo);
    return geo;
  }
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: THREE.ColorRepresentation) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    return this.add(g, color);
  }
  cyl(x: number, y: number, z: number, r: number, h: number, color: THREE.ColorRepresentation, seg = 10, rTop = r) {
    const g = new THREE.CylinderGeometry(rTop, r, h, seg);
    g.translate(x, y + h / 2, z);
    return this.add(g, color);
  }
  ball(x: number, y: number, z: number, r: number, color: THREE.ColorRepresentation, detail = 1, sy = 1) {
    const g = new THREE.IcosahedronGeometry(r, detail);
    g.scale(1, sy, 1);
    g.translate(x, y, z);
    return this.add(g, color);
  }
  quad(a: Point, b: Point, c: Point, d: Point, color: THREE.ColorRepresentation) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    g.computeVertexNormals();
    return this.add(g, color);
  }
  tri(a: Point, b: Point, c: Point, color: THREE.ColorRepresentation) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
    g.computeVertexNormals();
    return this.add(g, color);
  }
  build(material: THREE.Material, shadows = true) {
    const mesh = new THREE.Mesh(mergeGeometries(this.parts, false), material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    this.parts.forEach((p) => p.dispose());
    return mesh;
  }
}
