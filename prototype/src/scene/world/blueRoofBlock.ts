import * as THREE from 'three';
import { Batch, C } from './Batch';
import { hipRoof, tree } from './props';
import { signPlane } from './textures';

export function buildBlueRoofBlock(mat: THREE.Material, glowMat: THREE.Material) {
  const group = new THREE.Group();
  const b = new Batch(), g = new Batch();
  const x0 = 0, x1 = 47, z0 = 6, z1 = 50;
  const concrete = '#b8b4a6', concreteDk = '#9d9a8d', paleBlue = '#8dbfe4';
  b.box(x0 + 0.8, 0, z0 + 0.8, x1 - 0.8, 6, z1 - 0.8, '#e6e1cf');
  b.box(x0 + 0.6, 0, z0 + 0.6, x1 - 0.6, 1.5, z1 - 0.6, paleBlue);
  // Deep overhanging concrete band around the top.
  b.box(x0 - 0.6, 5.4, z0 - 0.6, x1 + 0.6, 8.1, z1 + 0.6, concrete);
  b.box(x0 - 0.65, 6.7, z0 - 0.65, x1 + 0.65, 6.78, z1 + 0.65, concreteDk);
  // Concrete columns.
  for (let z = z0 + 0.5; z < z1; z += 5.4) b.box(x0 - 0.2, 0, z, x0 + 1, 5.4, z + 0.9, concrete);
  for (let x = x0 + 0.5; x < x1; x += 5.4) {
    b.box(x, 0, z1 - 1, x + 0.9, 5.4, z1 + 0.2, concrete);
    b.box(x, 0, z0 - 0.2, x + 0.9, 5.4, z0 + 1, concrete);
  }
  // Ribbon windows set back behind the columns.
  for (let z = z0 + 1.7; z < z1 - 3; z += 5.4) {
    b.box(x0 + 0.5, 2, z, x0 + 0.62, 4.1, z + 4.1, paleBlue);
    g.box(x0 + 0.42, 2.15, z + 0.2, x0 + 0.5, 3.95, z + 3.9, '#9cc3e0');
  }
  for (let x = x0 + 1.7; x < x1 - 3; x += 5.4) {
    b.box(x, 2, z1 - 0.62, x + 4.1, 4.1, z1 - 0.5, paleBlue);
    g.box(x + 0.2, 2.15, z1 - 0.5, x + 3.9, 3.95, z1 - 0.42, '#9cc3e0');
  }
  // Stairs and platform on the street side.
  b.box(x0 - 3.2, 0, 22, x0 + 0.7, 1.15, 34, '#c5c1b3');
  for (let i = 0; i < 4; i++) b.box(x0 - 3.2 - (4 - i) * 0.42, 0, 23.5, x0 - 3.2, 0.29 * (i + 1), 32.5, i % 2 ? '#aca89a' : '#bbb7a9');
  // Blue metal roof with the courtyard opening.
  hipRoof(b, x0, z0, x1, z1, 8.1, 14.2, C.roof, [15.5, 23, 28.5, 33]);
  for (const [a0, c0, a1, c1] of [[15.5, 23, 28.5, 23.2], [15.5, 32.8, 28.5, 33], [15.5, 23, 15.7, 33], [28.3, 23, 28.5, 33]]) b.box(a0, 8.8, c0, a1, 14.2, c1, '#e6e1cf');
  b.box(15.7, 8.2, 23.2, 28.3, 8.4, 32.8, C.green3);
  tree(b, 22, 28, 2, 1);
  group.add(b.build(mat));
  group.add(g.build(glowMat, false));
  // Graduation banners like those on the street front.
  for (const z of [11, 38]) {
    const banner = signPlane(7, 1.9, (x, w, h) => {
      x.fillStyle = '#2d5fa8'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#ffffff'; x.font = '800 74px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('CONGRATULATIONS', w / 2, h / 2);
    }, 800);
    banner.position.set(x0 - 0.68, 7.1, z); banner.rotation.y = -Math.PI / 2;
    group.add(banner);
  }
  return group;
}
