import * as THREE from 'three';
import type { BuildingLabel, FloorKey, LocationDef } from '../types/campus';
import { BUILDING_LABELS, LOCATIONS } from '../utils/campusData';

// React renders the label buttons. This moves them to their 3D positions every frame.
export class LabelProjector {
  private labels: { def: LocationDef | BuildingLabel; el: HTMLElement; v: THREE.Vector3; show: boolean }[] = [];
  private on = true;
  private proj = new THREE.Vector3();
  private root: HTMLElement;
  private camera: THREE.Camera;
  private canvas: HTMLCanvasElement;

  constructor(root: HTMLElement, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.root = root;
    this.camera = camera;
    this.canvas = canvas;
    const byId = new Map([...root.querySelectorAll<HTMLElement>('[data-label-id]')].map((el) => [el.dataset.labelId, el]));
    for (const def of [...LOCATIONS, ...BUILDING_LABELS]) {
      const el = byId.get(def.id);
      if (el) this.labels.push({ def, el, v: new THREE.Vector3(...def.pos), show: false });
    }
  }

  setEnabled(on: boolean) {
    this.on = on;
  }

  // Campus labels show on the campus, and room labels only on their floor.
  refresh(floor: FloorKey | null, panoOpen: boolean) {
    for (const lb of this.labels) {
      const d = lb.def;
      const here = d.id.startsWith('_') ? !floor : ((d as LocationDef).floor || null) === floor;
      lb.show = here && this.on && !panoOpen;
    }
  }

  update(indoors: boolean) {
    // Campus labels would show through the walls while the player is indoors.
    this.root.style.display = indoors ? 'none' : '';
    if (indoors) return;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const { proj } = this;
    for (const lb of this.labels) {
      if (!lb.show) { lb.el.style.display = 'none'; continue; }
      proj.copy(lb.v).project(this.camera);
      if (proj.z > 1) { lb.el.style.display = 'none'; continue; }
      lb.el.style.display = 'block';
      lb.el.style.transform = `translate(-50%,-100%) translate(${(proj.x * 0.5 + 0.5) * w}px,${(-proj.y * 0.5 + 0.5) * h}px)`;
    }
  }
}
