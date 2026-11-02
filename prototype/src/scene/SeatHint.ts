// The message that floats above a bench seat within reach. Moved every frame, like name bubbles.
import * as THREE from 'three';
import { SEATS } from '../utils/seats';

const HINT_HEIGHT = 1.35;

export class SeatHint {
  readonly el = document.createElement('div');
  private proj = new THREE.Vector3();
  private camera: THREE.Camera;
  private canvas: HTMLCanvasElement;

  constructor(root: HTMLElement, camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.camera = camera;
    this.canvas = canvas;
    this.el.className = 'seat-hint';
    this.el.textContent = matchMedia('(max-width: 760px), (pointer: coarse)').matches ? 'Tap Sit' : 'Press E to sit';
    this.el.style.display = 'none';
    root.append(this.el);
  }

  update(seatIndex: number | null) {
    const seat = seatIndex === null ? null : SEATS[seatIndex];
    if (seat) this.proj.set(seat.x, HINT_HEIGHT, seat.z).project(this.camera);
    if (!seat || this.proj.z > 1) { this.el.style.display = 'none'; return; }
    this.el.style.display = 'block';
    const x = (this.proj.x * 0.5 + 0.5) * this.canvas.clientWidth;
    const y = (-this.proj.y * 0.5 + 0.5) * this.canvas.clientHeight;
    this.el.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`;
  }

  dispose() {
    this.el.remove();
  }
}
