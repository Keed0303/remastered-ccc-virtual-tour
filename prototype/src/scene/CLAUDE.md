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
| `CampusScene.ts` | Renderer, `scene`, the frame, mode switching, view switching, layer and theme toggles, keys, `dispose()`. |
| `CameraRig.ts` | The orbit camera, `OrbitControls`, and the eased flights between saved `VIEWS`. |
| `FollowCamera.ts` | Third-person camera in walk mode: mouse/touch look, zoom, pointer lock, wall avoidance. |
| `WalkController.ts` | The player on foot: input set, movement, step-up, gravity, jump, sitting, and the nearby-location probe. |
| `PanoViewer.ts` | The 360° photo: its own `Scene` and `PerspectiveCamera`, drawn with the shared renderer. |
| `Environment.ts` | Sky colour, fog, hemisphere and sun lights, and the shadow camera. One `apply(themeId, world)`. |
| `LabelProjector.ts` | Projects React-rendered location labels to screen space each frame. |
| `OnlinePlayers.ts` | Other logged-in students: figures, interpolation, seat poses, name bubbles, voice icons, position send. Owns `voice`. |
| `VoiceChat.ts` | The mic, one `RTCPeerConnection` per nearby student, and distance-mixed playback. |
| `SeatHint.ts` | The one "Press E to sit" bubble above a bench seat in reach. |
| `Npcs.ts`, `Traffic.ts` | Ambient students (`InstancedMesh`) and cars (`Group` of small meshes). |
| `Picking.ts` | One function, not a class: raycasts a click into a building or a floor-plan room. |
| `dispose.ts` | `disposeObject` / `disposeMaterial`. Everything that frees GPU memory goes through these. |
| `characters/figure.ts` | Blocky figure geometry, `swingLimbs`, `sitLimbs`, `setFigureLook`, `createAvatar`. |
| `world/` | Procedural geometry. `buildWorld` returns the `World` record and its own `dispose`. |

Construction order in the constructor is load-bearing in one place: `walk` is
built before `online`, and its `takenSeats` argument is an arrow that reads
`this.online` later. Keep cross-references between these objects as lazy
callbacks, never as a field read during construction.

## The frame

`CampusScene.frame` is the whole simulation. Its order matters:

1. Clamp `dt` to `0.05` so a tab returning from the background cannot teleport
   the player through a wall.
2. **Pano early-returns.** When `mode === 'pano'` nothing else updates — no
   walk, no NPCs, no labels, no voice. Anything that must keep running while a
   panorama is open cannot live below that return; `setMode` handles it instead
   (that is how the mic gets turned off).
3. `rig.update(dt)` advances the view tween even while walking.
4. Walking runs `walk.update` then `follow.update`, in that order: the camera
   reads the position the controller just wrote. Otherwise `controls.update()`
   damps the orbit camera.
5. NPCs, traffic, flag, `online.update` (which ends in `voice.update(places)`),
   the seat hint, compass, labels, then render.

**Every control multiplies by `dt`, and every accumulating value is clamped.**
Those two were named bugs in the original tour. `FollowCamera` clamps pitch to
`PITCH_MIN`/`PITCH_MAX` and distance to `ZOOM_MIN`/`ZOOM_MAX`; `PanoViewer`
clamps pitch to ±85° and fov to 35–95.

## Constructor and dispose are a pair

Everything created in a constructor needs a line in the matching `dispose()`,
and `CampusScene.dispose()` must call it. React Strict Mode mounts twice in
development, so a leak shows up immediately as a doubled scene, a stuck mic
light, or lost context.

- Listeners take an `AbortController` signal as `{ signal }` — never
  `removeEventListener`. `CampusScene` has one; `VoiceChat` has its own for the
  gesture listeners that unlock audio.
- Geometry and materials go through `disposeObject` (which walks the tree and
  handles `InstancedMesh` and `Light`) or `disposeMaterial` for a loose one.
- `CampusScene.dispose()` ends with `forceContextLoss()` and removes the
  canvas, and sets `disposed` first so a late async callback (`setPlayerLook`,
  the panorama's texture load, `getUserMedia` resolving) bails out instead of
  touching dead objects. `VoiceChat` keeps its own `disposed` flag and a
  `micRequest` counter for the same reason.
- Non-GPU resources need releasing too: mic tracks get `stop()`, every
  `RTCPeerConnection` is closed with its handlers nulled and its audio element
  detached (`closeLink`), and the `AudioContext` is closed.
- `figureMat` in `characters/figure.ts` is deliberately shared for the life of
  the page; `disposeFigure` frees only geometry marked `userData.figurePart`.
  Don't dispose that material.

## Modes

`_mode` is `'orbit' | 'pano' | 'walk'` and `_walking` is a separate flag that
stays true while a panorama is open from walking — that is how `closePano`
knows where to return. Go through `setMode`, never assign `_mode`: it fires
`onModeChange`, refreshes the labels, and tells voice whether the student is on
foot. `startWalk`/`stopWalk` are the only places that change `_walking`, and
each has a matching list of camera, controls, seat, and visibility changes to
undo.

`setView` is the single entry for changing what is visible: it records the view,
calls `showFloor` to swap building shells for a cutaway plan, flies the camera,
and refreshes labels. A new view means a new entry in `VIEWS`, not a branch here.

## Keys

`onKeyDown` is the only keyboard handler, and it guards on
`e.target instanceof HTMLInputElement` so typing in a form never moves the
player. Two keys are overloaded, and both read `e.repeat` so a held key fires
once:

- **E** sits or stands when a bench is in reach or the player is seated,
  otherwise falls through to `onCheckInKey` for the passport.
- **M** toggles the mic.
- **Esc** unwinds one layer at a time: pointer lock, then the panorama, then
  walking, then `onEscape` for React's dialogs.

## Talking to React

One direction each way, and **never per frame**:

- Out: optional callbacks on `SceneEvents` (`src/types/scene.ts`). Only
  discrete changes — a mode change, a new nearby location, a room click, a seat
  state, a mic state or message.
- In: React calls methods (`chooseView`, `setLayer`, `setTheme`, `setNpcCount`,
  `setPlayerLook`, `openPano`, `walk.useSeat`, `online.voice.toggleMic`).
- Shared DOM: the four elements in `SceneElements` are rendered by React and
  written by the scene through `.style` every frame — labels, name bubbles, the
  compass. Name bubbles and the seat hint are the exception to React owning the
  markup: the scene creates those elements itself inside the `bubbles` host and
  styles them from `campus.css`. Adding a per-frame readout means another
  element here, not state.

Input that React collects (the touch joystick) is written straight into
`walk.stick`; keys are written into `walk.keys`. Both are plain mutable
containers for exactly that reason. Voice icons are written as a `data-voice`
attribute and a `speaking` class on the name bubble, and `setVoiceIcon` skips
the write when nothing changed.

## Sitting

`../utils/seats.ts` is the single source: `BENCHES` (drawn by
`world/ground.ts`), `SEATS` derived from it, `nearestSeat`, and `cleanSeat`.
Nothing in this directory hand-writes a seat position.

**A seat index, not a coordinate, goes over the wire** (`s` on `Move`). The
receiving browser looks the index up in its own `SEATS` and places the figure
there, so another client cannot park a figure mid-air. `WalkController` asks
`online.takenSeats()` before offering a seat, so two students do not share one —
that check is cosmetic comfort, not security.

Sitting is an eased `SeatMove` (position, facing, and `sitBlend` together), and
`waitForRelease` stops an already-held key from standing the player straight
back up. Remote figures run the same blend in `OnlinePlayers`, so everyone sees
the same ease.

## Voice

`VoiceChat` is WebRTC with STUN only — audio travels browser to browser and
never through Supabase, which carries only signaling, as the `voice` event on
the `campus` channel. The pure rules (range, volume curve, peer choice, badge
state, message validation) live in `../utils/voice.ts` with tests beside them;
this class holds only the browser plumbing. See
`devnote/2026-11-02-voice-talk.md`.

Things that will bite:

- **On foot only.** `setMode` calls `setOnFoot`, which drops the mic and every
  link outside walk mode. This is deliberate rather than a frame-loop check,
  because the loop early-returns for panoramas.
- **The lower user id offers** (`isInitiator`), so a pair never both offer.
- ICE candidates are bundled into the offer and answer (`iceGathered`) to keep
  channel traffic down, so a connection costs one round trip and up to
  `GATHER_MS` of waiting.
- An audio transceiver is added up front with `direction: 'sendrecv'`, so
  turning the mic on later needs no renegotiation.
- Chrome plays remote WebRTC audio through Web Audio only while a muted
  `HTMLAudioElement` also holds the stream — that is what `playTrack` does.
  Don't remove the element.
- Autoplay policy means the `AudioContext` starts suspended;
  `checkSoundBlocked` notices and asks the student for a tap.

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
walking. Bench geometry has the same relationship with `../utils/seats.ts`,
including `HIP_HEIGHT`, which already accounts for the figure's 1.15 scale.

## Untrusted input

`OnlinePlayers` and `VoiceChat` are the only parts of the scene fed by other
clients, and nothing from them is believed:

- Profiles go through `cleanProfile`, seat numbers through `cleanSeat`, and
  voice messages through `cleanVoiceMessage` (which also caps id and SDP length).
- Every `applyMove` coordinate is clamped to `WALK_BOUNDS` and a sane `y`.
- Signaling is acted on only when it is addressed to this student and the
  sender is a known online player (`isPlayer`), and an offer is refused past
  `MAX_VOICE_PEERS`.

Keep it that way — another client must not be able to place a figure outside
the campus, feed `NaN` into a matrix, or open unbounded peer connections.

## Testing the scene

In development `window.__ccc` is the live `CampusScene` (set in
`useCampusScene`, absent from production builds). Playwright drives it directly
— `walk.update(dt)`, `follow.update(dt)`, `avatar.position.set(...)`,
`world.floors.ob_gf.visible`, `online.players`, `online.voice.links` — so the
public fields tests read (`walk`, `follow`, `online`, `seatHint`, `npcs`,
`traffic`, `world`, `avatar`) are part of the test surface: renaming one breaks
`tests/e2e/regression.spec.ts`. There are no unit tests in this directory; the
pure rules live in `../utils/` (`physics`, `seats`, `voice`, `passport`,
`layers`) with tests beside them. Prefer moving a rule there over testing it
through the scene.
