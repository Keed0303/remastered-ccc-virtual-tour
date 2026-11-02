import * as THREE from 'three';
import type { FloorKey, Room, RoomKind } from '../../types/campus';
import { FLOORS } from '../../utils/campusData';
import { Batch, C } from './Batch';
import { tree } from './props';
import { canvasTex } from './textures';

const ROOM_TONE: Record<RoomKind, string> = {
  class: '#e8eef6', lab: '#dcebf3', comlab: '#dae6f5', office: '#efe9dd', hall: '#f3e2c9', lobby: '#ecd9c4',
  library: '#ead9c7', closed: '#d0d3d6', garden: '#b6d9a8', void: '#c3dcc0',
};

function furnish(b: Batch, r: Room) {
  const w = r.x1 - r.x0, d = r.z1 - r.z0;
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  if (r.k === 'class' || r.k === 'lab' || r.k === 'comlab') {
    const cols = Math.max(1, Math.floor(w / 2.6)), rows = Math.max(1, Math.floor(d / 2.6));
    const dark = r.k === 'comlab';
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = r.x0 + ((i + 0.5) * w) / cols, z = r.z0 + ((j + 0.5) * d) / rows;
        b.box(x - 0.65, 0.65, z - 0.35, x + 0.65, 0.78, z + 0.35, r.k === 'lab' ? '#ffffff' : C.wood);
        b.box(x - 0.08, 0, z - 0.08, x + 0.08, 0.65, z + 0.08, C.dark);
        if (dark) b.box(x - 0.35, 0.78, z - 0.25, x + 0.35, 1.25, z - 0.17, C.dark);
      }
    }
  } else if (r.k === 'library') {
    for (let x = r.x0 + 1.4; x < r.x1 - 1; x += 3) b.box(x, 0, r.z0 + 0.8, x + 0.8, 2, r.z1 - 0.8, C.brown);
  } else if (r.k === 'hall') {
    const rows = Math.floor(d / 1.6), cols = Math.floor(w / 1.5);
    if (w > 6 && d > 6) {
      b.box(r.x0 + 0.5, 0, r.z0 + 0.5, r.x1 - 0.5, 0.5, r.z0 + 3, C.brown);
      for (let i = 0; i < cols; i++) for (let j = 2; j < rows; j++) b.box(r.x0 + i * 1.5 + 0.5, 0, r.z0 + j * 1.6 + 0.3, r.x0 + i * 1.5 + 1.1, 0.5, r.z0 + j * 1.6 + 0.9, C.blue);
    } else {
      for (let i = 0; i < Math.floor(w / 3); i++) b.cyl(r.x0 + 1.5 + i * 3, 0, cz, 0.8, 0.75, C.wood, 8);
    }
  } else if (r.k === 'office' && w > 2 && d > 2) {
    b.box(cx - 1, 0, cz - 0.4, cx + 1, 0.8, cz + 0.4, C.wood);
  } else if (r.k === 'garden') {
    b.cyl(cx, 0, cz, Math.min(w, d) * 0.28, 0.25, C.paver, 8);
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) b.cyl(cx + dx, 0.25, cz + dz, 0.12, 2.6, C.white, 6);
    b.ball(cx, 3.2, cz, 2.4, C.brown, 0, 0.4);
    tree(b, r.x0 + 1.5, r.z0 + 2, 0.8, 0);
    tree(b, r.x1 - 1.5, r.z1 - 2, 0.8, 1);
  } else if (r.k === 'lobby') {
    b.box(cx - 1.6, 0, cz - 0.5, cx + 1.6, 1, cz + 0.5, C.blue);
  }
}

export function buildFloor(key: FloorKey, mat: THREE.Material) {
  const fl = FLOORS[key], f = fl.foot;
  const group = new THREE.Group();
  group.name = key;
  const b = new Batch();
  b.box(f.x0 - 0.5, 0, f.z0 - 0.5, f.x1 + 0.5, 0.18, f.z1 + 0.5, C.slab);
  const wallH = 2.1, t = 0.2;
  const up = new Batch();
  for (const r of fl.rooms) {
    b.box(r.x0, 0.18, r.z0, r.x1, 0.24, r.z1, ROOM_TONE[r.k] || '#eee');
    if (r.k !== 'void' && r.k !== 'garden') {
      const wc = r.k === 'closed' ? '#a8adb3' : '#ffffff';
      up.box(r.x0, 0, r.z0, r.x1, wallH, r.z0 + t, wc);
      const mid = (r.x0 + r.x1) / 2;
      up.box(r.x0, 0, r.z1 - t, mid - 0.7, wallH, r.z1, wc);
      up.box(mid + 0.7, 0, r.z1 - t, r.x1, wallH, r.z1, wc);
      up.box(r.x0, 0, r.z0, r.x0 + t, wallH, r.z1, wc);
      up.box(r.x1 - t, 0, r.z0, r.x1, wallH, r.z1, wc);
      up.box(r.x0, wallH, r.z0, r.x1, wallH + 0.06, r.z0 + t, C.blue);
      up.box(r.x0, wallH, r.z1 - t, r.x1, wallH + 0.06, r.z1, C.blue);
      up.box(r.x0, wallH, r.z0, r.x0 + t, wallH + 0.06, r.z1, C.blue);
      up.box(r.x1 - t, wallH, r.z0, r.x1, wallH + 0.06, r.z1, C.blue);
    }
    if (r.k !== 'closed') furnish(up, r);
  }
  group.add(b.build(mat));
  const walls = up.build(mat);
  walls.position.y = 0.24;
  group.add(walls);

  // All room names share one transparent plane instead of many DOM labels.
  const W = f.x1 - f.x0, D = f.z1 - f.z0;
  const px = 2048, py = Math.round((px * D) / W);
  const tex = canvasTex(px, py, (x) => {
    x.clearRect(0, 0, px, py);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const r of fl.rooms) {
      const cx = ((r.x0 + r.x1) / 2 - f.x0) / W * px, cy = ((r.z0 + r.z1) / 2 - f.z0) / D * py;
      const rw = (r.x1 - r.x0) / W * px;
      const size = Math.max(19, Math.min(42, rw / Math.max(5, r.n.length * 0.62)));
      x.font = `700 ${size}px Inter, Arial, sans-serif`;
      const tw = x.measureText(r.n).width + 18;
      x.fillStyle = r.k === 'closed' ? 'rgba(90,96,104,.86)' : 'rgba(23,74,140,.9)';
      x.beginPath(); x.roundRect(cx - tw / 2, cy - size * 0.75, tw, size * 1.5, 8); x.fill();
      x.fillStyle = '#fff'; x.fillText(r.n, cx, cy + 1);
    }
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.set((f.x0 + f.x1) / 2, 3.1, (f.z0 + f.z1) / 2);
  plane.renderOrder = 5;
  group.add(plane);
  group.visible = false;
  return group;
}
