import * as THREE from 'three';
import type { FloorKey, LocationDef } from '../types/campus';
import type { Look } from '../types/character';
import type { LayerId, SceneElements, SceneEvents, SceneMode } from '../types/scene';
import { DEFAULT_LOOK, FLOORS, NORTH_YAW_DEG, VIEWS } from '../utils/campusData';
import { indoorBounds } from '../utils/physics';
import { CameraRig } from './CameraRig';
import { createAvatar, disposeFigure, setFigureLook } from './characters/figure';
import { disposeObject } from './dispose';
import { Environment } from './Environment';
import { FollowCamera } from './FollowCamera';
import { LabelProjector } from './LabelProjector';
import { Npcs } from './Npcs';
import { OnlinePlayers } from './OnlinePlayers';
import { PanoViewer } from './PanoViewer';
import { enablePicking } from './Picking';
import { Traffic } from './Traffic';
import { WalkController } from './WalkController';
import { buildWorld, type World } from './world/buildWorld';

const WALK_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'];

// Owns the WebGL scene, the render loop, and every per-frame update. Nothing here uses React.
export class CampusScene {
  readonly canvas = document.createElement('canvas');
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly rig: CameraRig;
  readonly world: World;
  readonly avatar = createAvatar(DEFAULT_LOOK);
  readonly walk: WalkController;
  readonly follow: FollowCamera;
  readonly online: OnlinePlayers;
  readonly npcs: Npcs;
  readonly traffic: Traffic;
  private environment: Environment;
  private pano: PanoViewer;
  private labels: LabelProjector;
  private compass: HTMLElement;
  private events: SceneEvents;
  private listeners = new AbortController();
  private timer = new THREE.Timer();
  private northDir = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(NORTH_YAW_DEG)), 0, -Math.cos(THREE.MathUtils.degToRad(NORTH_YAW_DEG)));
  private camDir = new THREE.Vector3();
  private _mode: SceneMode = 'orbit';
  private _walking = false;
  private _view = 'overview';
  private disposed = false;

  constructor(elements: SceneElements, events: SceneEvents = {}) {
    this.events = events;
    this.compass = elements.compass;
    const { canvas, scene, avatar } = this;
    const { signal } = this.listeners;
    canvas.id = 'scene';
    canvas.setAttribute('aria-label', '3D model of City College of Calamba');
    elements.host.append(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    this.renderer = renderer;

    this.rig = new CameraRig(canvas);
    this.environment = new Environment(scene);
    this.world = buildWorld(scene);
    this.npcs = new Npcs(scene);
    this.traffic = new Traffic(scene);
    avatar.visible = false;
    scene.add(avatar);

    const camera = this.rig.camera;
    const inWalk = () => this._mode === 'walk';
    this.follow = new FollowCamera(camera, avatar, canvas, inWalk, (locked) => events.onMouseLockChange?.(locked), signal);
    this.walk = new WalkController(avatar, () => this.follow.look.yaw, (l) => events.onNearbyChange?.(l));
    this.pano = new PanoViewer(renderer, canvas, () => this._mode === 'pano', signal);
    this.labels = new LabelProjector(elements.labels, camera, canvas);
    this.online = new OnlinePlayers(scene, camera, canvas, avatar, elements.bubbles, () => this._walking, { onMicChange: (state) => events.onMicChange?.(state), onMicError: (message) => events.onMicError?.(message) });
    enablePicking({
      canvas, camera, world: this.world, signal,
      isOrbit: () => this._mode === 'orbit',
      currentFloor: () => this.currentFloor,
      onBuilding: (id) => this.setView(id),
      onRoom: (name, x, y) => events.onRoomClick?.(name, x, y),
    });

    addEventListener('keydown', (e) => this.onKeyDown(e), { signal });
    addEventListener('keyup', (e) => this.walk.keys.delete(e.code), { signal });
    addEventListener('blur', () => this.walk.keys.clear(), { signal });
    addEventListener('resize', () => this.resize(), { signal });
    this.resize();

    const first = VIEWS[0];
    this.rig.jumpTo(first.cam, first.target);
    this.setTheme('day');
    this.setView('overview', false);
    this.npcs.update(0, 0);
    this.traffic.update(0);
  }

  get mode() { return this._mode; }
  get walking() { return this._walking; }
  get view() { return this._view; }
  private get currentFloor(): FloorKey | null { return VIEWS.find((v) => v.id === this._view)?.floor ?? null; }

  start() {
    this.timer.reset();
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  private frame(timestamp: number) {
    this.timer.update(timestamp);
    const dt = Math.min(this.timer.getDelta(), 0.05);
    const time = this.timer.getElapsed();
    if (this._mode === 'pano') {
      this.pano.render();
      return;
    }
    this.rig.update(dt);
    if (this._walking) {
      this.walk.update(dt);
      this.follow.update(dt);
    } else {
      this.rig.controls.update();
    }
    this.npcs.update(dt, time);
    this.traffic.update(dt);
    this.world.flag.wave(time);
    this.online.update(dt, time);
    this.updateCompass();
    this.labels.update(this._walking && indoorBounds(this.avatar.position.x, this.avatar.position.z));
    this.renderer.render(this.scene, this.rig.camera);
  }

  private updateCompass() {
    this.rig.camera.getWorldDirection(this.camDir);
    const heading = Math.atan2(this.camDir.x, -this.camDir.z) - Math.atan2(this.northDir.x, -this.northDir.z);
    this.compass.style.transform = `rotate(${-heading}rad)`;
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Escape') {
      if (this.follow.escapeFreesMouse) return;
      if (this._mode === 'pano') this.closePano();
      else if (this._walking) this.stopWalk();
      else this.events.onEscape?.();
      return;
    }
    if (e.target instanceof HTMLInputElement || !this._walking || this._mode !== 'walk') return;
    if (WALK_KEYS.includes(e.code)) {
      this.walk.keys.add(e.code);
      e.preventDefault();
    }
    if (e.code === 'KeyE') this.events.onCheckInKey?.();
    if (e.code === 'KeyM' && !e.repeat) void this.online.voice.toggleMic();
  }

  private setMode(mode: SceneMode) {
    this._mode = mode;
    this.online.voice.setOnFoot(mode === 'walk');
    this.events.onModeChange?.(mode, this._walking);
    this.labels.refresh(this.currentFloor, mode === 'pano');
  }

  private showFloor(key: FloorKey | null) {
    const { world } = this;
    for (const [k, g] of Object.entries(world.floors)) g.visible = k === key;
    const building = key ? FLOORS[key].building : null;
    world.oldB.visible = building !== 'old';
    world.newB.visible = building !== 'new';
    world.hall.visible = building !== 'old';
    const strip = world.ground.getObjectByName('eastStrip');
    if (strip) strip.visible = !key;
  }

  setView(id: string, fly = true) {
    const v = VIEWS.find((x) => x.id === id);
    if (!v) return;
    this._view = id;
    this.showFloor(v.floor ?? null);
    if (fly) this.rig.flyTo(v.cam, v.target);
    this.events.onViewChange?.(id);
    this.labels.refresh(v.floor ?? null, this._mode === 'pano');
  }

  // A view chosen from the side panel also ends walking.
  chooseView(id: string) {
    if (this._mode === 'walk') this.stopWalk();
    this.setView(id);
  }

  focusLocation(l: LocationDef, fly: boolean) {
    if (this._mode === 'walk' && fly) this.stopWalk();
    if (l.floor && this._view !== l.floor) this.setView(l.floor, false);
    if (!l.floor && this.currentFloor) this.setView(l.id === 'entrance' ? 'overview' : 'plaza', false);
    if (fly && this._mode === 'orbit') {
      const [x, , z] = l.pos;
      this.rig.flyTo(l.floor ? [x, 34, z + 30] : [x - 36, 27, z - 38], [x, l.floor ? 0 : Math.min(l.pos[1], 4), z]);
    }
  }

  openPano(l: LocationDef) {
    this.rig.controls.enabled = false;
    this.pano.open(l.pano, () => this.events.onPanoError?.());
    this.setMode('pano');
  }

  closePano() {
    this.rig.controls.enabled = !this._walking;
    this.setMode(this._walking ? 'walk' : 'orbit');
  }

  startWalk() {
    this._walking = true;
    this.setView('overview', false);
    this.avatar.visible = true;
    this.walk.spawn();
    this.rig.camera.clearViewOffset();
    this.rig.stopTween();
    this.rig.controls.enabled = false;
    this.follow.reset();
    this.setMode('walk');
    this.follow.update(0);
  }

  stopWalk() {
    this._walking = false;
    this.avatar.visible = false;
    this.walk.stop();
    this.follow.releaseMouse();
    this.follow.look.drag = null;
    this.rig.controls.enabled = true;
    this.rig.controls.target.copy(this.avatar.position);
    this.resize();
    this.setMode('orbit');
    this.setView('overview');
  }

  setTheme(id: string) {
    this.environment.apply(id, this.world);
  }

  setLayer(id: LayerId, on: boolean) {
    if (id === 'people') this.npcs.group.visible = on;
    else if (id === 'cars') this.traffic.group.visible = on;
    else if (id === 'wire') this.world.mat.wireframe = on;
    else {
      this.labels.setEnabled(on);
      this.labels.refresh(this.currentFloor, this._mode === 'pano');
    }
  }

  setNpcCount(count: number) {
    this.npcs.active = count;
  }

  setPlayerLook(look: Look) {
    if (!this.disposed) setFigureLook(this.avatar, look, { backpack: true });
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const { camera } = this.rig;
    this.renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Centre the scene in the space beside the side panel.
    if (w > 760 && !this._walking) camera.setViewOffset(w, h, -120, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    this.pano.resize(w / h);
  }

  // Releases everything this scene created, so it can be mounted again without leaks.
  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.listeners.abort();
    this.online.dispose();
    this.follow.dispose();
    this.rig.dispose();
    this.pano.dispose();
    this.npcs.dispose();
    this.traffic.dispose();
    this.environment.dispose();
    this.world.dispose();
    disposeFigure(this.avatar);
    disposeObject(this.avatar);
    this.avatar.removeFromParent();
    this.timer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}
