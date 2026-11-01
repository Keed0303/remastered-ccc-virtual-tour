import * as THREE from 'three';

// The 360 degree photo viewer, with its own small scene and camera.
export class PanoViewer {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1200);
  private geometry = new THREE.SphereGeometry(500, 64, 40);
  // The original panoramas are stored mirrored, so the inside of an unflipped sphere reads correctly.
  private material = new THREE.MeshBasicMaterial({ color: '#222', side: THREE.BackSide });
  private loader = new THREE.TextureLoader();
  private view = { yaw: 0, pitch: 0, drag: null as [number, number] | null };
  private renderer: THREE.WebGLRenderer;
  private disposed = false;

  constructor(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement, isActive: () => boolean, signal: AbortSignal) {
    this.renderer = renderer;
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
    const { view, camera } = this;
    canvas.addEventListener('pointerdown', (e) => {
      if (!isActive()) return;
      view.drag = [e.clientX, e.clientY];
      canvas.setPointerCapture(e.pointerId);
    }, { signal });
    canvas.addEventListener('pointermove', (e) => {
      if (!isActive() || !view.drag) return;
      const k = 0.11 * (camera.fov / 75);
      view.yaw -= (e.clientX - view.drag[0]) * k;
      view.pitch = THREE.MathUtils.clamp(view.pitch + (e.clientY - view.drag[1]) * k, -85, 85);
      view.drag = [e.clientX, e.clientY];
    }, { signal });
    addEventListener('pointerup', () => { view.drag = null; }, { signal });
    canvas.addEventListener('wheel', (e) => {
      if (!isActive()) return;
      e.preventDefault();
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.04, 35, 95);
      camera.updateProjectionMatrix();
    }, { passive: false, signal });
  }

  open(url: string, onError: () => void) {
    const { view, camera, material } = this;
    view.yaw = 0; view.pitch = 0; camera.fov = 75; camera.updateProjectionMatrix();
    this.loader.load(url, (t) => {
      if (this.disposed) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      material.map?.dispose();
      material.map = t;
      material.color.set('#ffffff');
      material.needsUpdate = true;
    }, undefined, onError);
  }

  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  render() {
    const y = THREE.MathUtils.degToRad(this.view.yaw), p = THREE.MathUtils.degToRad(this.view.pitch);
    this.camera.lookAt(Math.cos(p) * Math.sin(y) * 10, Math.sin(p) * 10, -Math.cos(p) * Math.cos(y) * 10);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.material.map?.dispose();
    this.material.dispose();
    this.geometry.dispose();
  }
}
