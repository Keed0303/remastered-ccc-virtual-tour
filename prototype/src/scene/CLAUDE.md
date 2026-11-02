# CLAUDE.md — `src/scene/`

The imperative Three.js half of the app. **No React, no hooks, no JSX in this
directory**, and nothing here imports from `src/components/` or `src/hooks/`.
Read `../../CLAUDE.md` first; this note covers only what is specific to the
scene.

## What owns what

`CampusScene` is the only class the rest of the app constructs. It owns the
renderer, the single render loop, and every per-frame update, and it delegates
to one object per concern:

| File | Owns |
|---|---|
| `CampusScene.ts` | Renderer, `scene`, the frame, mode switching, view switching, layer and theme toggles, `dispose()`. |
| `CameraRig.ts` | The orbit camera, `OrbitControls`, and the eased flights between saved `VIEWS`. |
| `FollowCamera.ts` | Third-person camera in walk mode: mouse/touch look, zoom, pointer lock, wall avoidance. |
| `WalkController.ts` | The player on foot: input set, movement, step-up, gravity, jump, and the nearby-location probe. |
| `PanoViewer.ts` | The 360° photo: its own `Scene` and `PerspectiveCamera`, drawn with the shared renderer. |
| `Environment.ts` | Sky colour, fog, hemisphere and sun lights, and the shadow camera. One `apply(themeId, world)`. |
| `LabelProjector.ts` | Projects React-rendered location labels to screen space each frame. |
| `OnlinePlayers.ts` | Other logged-in students: figures, interpolation, name bubbles, and position send. |
| `Npcs.ts`, `Traffic.ts` | Ambient students (`InstancedMesh`) and cars (`Group` of small meshes). |
| `Picking.ts` | One function, not a class: raycasts a click into a building or a floor-plan room. |
| `dispose.ts` | `disposeObject` / `disposeMaterial`. Everything that frees GPU memory goes through these. |
| `characters/figure.ts` | Blocky figure geometry, `swingLimbs`, `setFigureLook`, `createAvatar`. |
| `world/` | Procedural geometry. `buildWorld` returns the `World` record and its own `dispose`. |

## The frame

`CampusScene.frame` is the whole simulation. Its order matters:

1. Clamp `dt` to `0.05` so a tab returning from the background cannot teleport
   the player through a wall.
2. **Pano early-returns.** When `mode === 'pano'` nothing else updates — no
   walk, no NPCs, no labels. Anything new that must keep running in a panorama
   has to go above that return, and should not.
3. `rig.update(dt)` advances the view tween even while walking.
4. Walking runs `walk.update` then `follow.update`, in that order: the camera
   reads the position the controller just wrote. Otherwise `controls.update()`
   damps the orbit camera.
5. NPCs, traffic, flag, online players, compass, labels, then render.

**Every control multiplies by `dt`, and every accumulating value is clamped.**
Those two were named bugs in the original tour. `FollowCamera` clamps pitch to
`PITCH_MIN`/`PITCH_MAX` and distance to `ZOOM_MIN`/`ZOOM_MAX`; `PanoViewer`
clamps pitch to ±85° and fov to 35–95.

## Constructor and dispose are a pair

Everything created in a constructor needs a line in the matching `dispose()`,
and `CampusScene.dispose()` must call it. React Strict Mode mounts twice in
development, so a leak shows up immediately as a doubled scene or lost context.

- Listeners take `this.listeners.signal` as `{ signal }` — never
  `removeEventListener`. One `abort()` detaches them all.
- Geometry and materials go through `disposeObject` (which walks the tree and
  handles `InstancedMesh` and `Light`) or `disposeMaterial` for a loose one.
- `CampusScene.dispose()` ends with `forceContextLoss()` and removes the
  canvas, and sets `disposed` first so a late async callback (`setPlayerLook`,
  the panorama's texture load) bails out instead of touching dead objects.
- `figureMat` in `characters/figure.ts` is deliberately shared for the life of
  the page; `disposeFigure` frees only geometry marked `userData.figurePart`.
  Don't dispose that material.

## Modes

`_mode` is `'orbit' | 'pano' | 'walk'` and `_walking` is a separate flag that
stays true while a panorama is open from walking — that is how `closePano`
knows where to return. Go through `setMode`, never assign `_mode`: it fires
`onModeChange` and refreshes the labels. `startWalk`/`stopWalk` are the only
places that change `_walking`, and each has a matching list of camera,
controls, and visibility changes to undo.

`setView` is the single entry for changing what is visible: it records the view,
calls `showFloor` to swap building shells for a cutaway plan, flies the camera,
and refreshes labels. A new view means a new entry in `VIEWS`, not a branch here.

## Talking to React

One direction each way, and **never per frame**:

- Out: optional callbacks on `SceneEvents` (`src/types/scene.ts`). Only
  discrete changes — a mode change, a new nearby location, a room click.
- In: React calls methods (`chooseView`, `setLayer`, `setTheme`, `setNpcCount`,
  `setPlayerLook`, `openPano`).
- Shared DOM: the four elements in `SceneElements` are rendered by React and
  written by the scene through `.style` every frame — labels, name bubbles, the
  compass. Adding a per-frame readout means another element here, not state.

Input that React collects (the touch joystick) is written straight into
`walk.stick`; keys are written into `walk.keys`. Both are plain mutable
containers for exactly that reason.

## Geometry rules

`world/` accumulates into `Batch` and calls `build(material)` once per group —
the draw-call budget is under 150, so new scenery joins an existing batch
rather than becoming its own `Mesh`. Colours come from `C` in `world/Batch.ts`.
`Batch.add` strips UVs and bakes colour into a `color` attribute, so a batched
surface can never be textured: anything that needs a texture is a separate mesh
(`world/textures.ts` — `canvasTex`, `signPlane`) or a baked canvas plane, as the
floor-plan room names are.

Crowds and cars are different: `Npcs` allocates `InstancedMesh` for `NPC_MAX`,
sets `frustumCulled = false` because students spread across the whole campus,
and shrinks `count` rather than hiding instances. `Traffic` is small enough to
stay plain meshes.

Walls, steps, and ceilings built in `world/` are duplicated by hand in
`../utils/physics.ts` (`COLLIDERS`, `floorHeight`, `cameraCeiling`). Moving
geometry here without updating that file is the most likely way to break
walking.

## Untrusted input

`OnlinePlayers` is the only part of the scene fed by other clients. Every
profile goes through `cleanProfile`, and every `applyMove` number is clamped to
`WALK_BOUNDS` and a sane `y`. Keep it that way — a hostile client must not be
able to place a figure outside the campus or feed `NaN` into a matrix.

## Testing the scene

In development `window.__ccc` is the live `CampusScene` (set in
`useCampusScene`, absent from production builds). Playwright drives it directly
— `walk.update(dt)`, `follow.update(dt)`, `avatar.position.set(...)`,
`world.floors.ob_gf.visible` — so public fields that tests read
(`walk`, `follow`, `online`, `npcs`, `traffic`, `world`, `avatar`) are part of
the test surface: renaming one breaks `tests/e2e/regression.spec.ts`. There are
no unit tests in this directory; the pure rules live in `../utils/` with tests
beside them.
