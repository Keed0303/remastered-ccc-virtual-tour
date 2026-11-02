# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A React, TypeScript, and Three.js prototype for the **CCC Virtual Tour V2** remaster — a gamified 3D
model of City College of Calamba (Calamba, Laguna, Philippines) that replaces a
2022 desktop 360°-panorama tour. This is **Stage A** of a staged plan: a
stylized procedural campus diorama with cutaway floor plans, the original 360°
photos embedded as viewpoints, an on-foot walking mode, and a "Student
Passport" game layer.

It is an undergraduate thesis project. Read `devnote/remaster-plan.md` before
making design decisions — it holds the staging plan, the performance budget,
and the architectural direction. `devnote/ccc-virtual-tour-investigation.md` is
the baseline analysis of the original app (52 panoramas, its wiring bugs) and is
the source of truth for what content exists.

The git repo root is one level **above** this directory (`../.git`); the app
lives in `prototype/`. `../video/` is gitignored.

## Commands

```bash
npm install
npm run dev        # Vite dev server on :5173
npm run build      # -> dist/
npm run preview    # serve dist/ on :5173
npm run typecheck  # strict TypeScript, no output
npm test           # Vitest logic tests in src/**/*.test.ts
npm run test:e2e   # Playwright browser tests in tests/e2e, on the demo backend
```

Vitest stays on 3.x because later versions exclude Node 23, which this machine
runs. Playwright runs one test at a time, because software WebGL and two-student
tests overload the CPU in parallel. It uses the installed Chrome with software WebGL, and starts its
own server on :5174. There is no linter or formatter.

In development only, `window.__ccc` is the live `CampusScene`. Browser tests use
it to step the simulation deterministically (`walk.update`, `follow.update`).
It does not exist in production builds.

Note: the user-level `/implement-features` skill describes a different project
(Next.js + Supabase + Jest). Its stack-specific instructions do not apply here.

## Layout

| Path | Role |
|---|---|
| `index.html` | Page shell with the author and copyright meta tags. All other markup is in React. |
| `src/main.tsx`, `src/App.tsx` | Entry point and routes: the campus at `/`, and the lazy admin page at `/admin`. |
| `src/components/` | React UI: `campus/`, `passport/`, `account/`, `admin/`, `common/`. |
| `src/hooks/` | React state and effects, including `useCampusScene`, `useAuth`, and `useCampusPresence`. |
| `src/scene/` | Imperative Three.js with no React. `CampusScene` owns the renderer, the render loop, and `dispose()`. |
| `src/scene/world/` | Procedural geometry: ground, three buildings, walk-in lobby, floor plans, and the `Batch` class. |
| `src/scene/characters/figure.ts` | The blocky student figures. |
| `src/utils/campusData.ts` | **All content.** Floor plans, locations, quizzes, badges, camera views, themes, swatches. |
| `src/utils/physics.ts` | `COLLIDERS`, `floorHeight`, `cameraCeiling`, `indoorBounds`, `WALK_BOUNDS`. |
| `src/utils/validation.ts` | `cleanProfile`, `cleanSettings`, and form validation. |
| `src/utils/passport.ts`, `layers.ts`, `voice.ts` | Pure game, layer, and voice rules, with tests beside them. |
| `src/utils/backend/` | Accounts and presence behind one interface: Supabase when configured, or a local demo in `npm run dev`. |
| `src/types/` | Shared TypeScript types. |
| `src/styles/` | `campus.css` and `account.css` load with the campus. `admin.css` loads with the admin page. |
| `supabase/migrations/` | Append-only database changes. Apply in the Supabase SQL editor or with `supabase db push`. |
| `supabase/functions/admin-users/` | Edge Function for account changes. The only code allowed to use `service_role`. It runs on Deno, outside the app's TypeScript config. |
| `public/panos/*.jpg` | The 12 original panoramas in use (of 52 available). |

## Conventions that matter

**React never runs per frame.** Keys, joystick, camera, player position, NPC
matrices, and label positions stay in `src/scene`. The scene reports changes
through `SceneEvents`, and React calls its methods. Labels, name bubbles, the
compass, and the joystick knob are written through their `style` every frame.
Never put that data in `useState`.

**Everything the scene creates must be released.** React Strict Mode mounts twice
in development. Listeners use the scene's `AbortSignal`, and new objects need a
place in `CampusScene.dispose()`. Realtime joins and leaves run through a promise
queue (see `useCampusPresence`), because the client reuses a channel that is
still closing.

**Each route brings its own global CSS.** The campus and admin stylesheets style
the same elements differently, so links between them are plain `<a href>` full
page loads, not router links. Hosting must serve `index.html` for `/admin`, which
`vercel.json` does on Vercel. A new route needs a new line there.

**Voice travels directly between browsers.** `scene/VoiceChat.ts` sits under
`OnlinePlayers` and uses WebRTC with STUN only, so strict networks show the amber
icon. Signaling runs on the `campus` channel as the `voice` event, and every
message goes through `cleanVoiceMessage`. Voice works on foot only: `setMode`
turns it off in a panorama or when walking stops, which also keeps it clear of the
render loop's panorama early return. See `devnote/2026-11-02-voice-talk.md`.

**Content lives in data, not code.** This is the central rule carried over from
the plan, and the fix for the original app's 3,286 lines of hand-wired
navigation. Adding a location should mean one entry in `LOCATIONS` and nothing
else — no new function, no new DOM. The same applies to `FLOORS`, `VIEWS`,
`THEMES`, `BADGES`, and `LAYERS` in `utils/layers.ts`: they are rendered by
mapping over the array.

**The coordinate system is metres on a local grid rotated ~25° from true
north** (`NORTH_YAW_DEG`). `x` runs roughly east, `z` roughly south, `y` up.
Every dimension is **estimated from satellite imagery, Street View, and the
original floor plans — not surveyed.** Keep estimates labelled as such in UI
copy, and do not present them as measured.

**Room rectangles are derived, not typed in.** `FLOORS` rooms are expressed in
*floor-plan image pixel coordinates* and mapped onto a real-world footprint by
`oldRect` / `newRect` (which also apply the plan rotations). Use the `obgf`,
`oblg`, `nb` helpers; never hand-write world-space room bounds. Location
positions prefer `centre('floor', 'Room Name')` over literals so a plan refit
moves them automatically.

**Geometry is batched.** `scene/world/` uses the `Batch` class: accumulate coloured
boxes/cylinders/quads, then `build(material)` merges them into one
`vertexColors` mesh. The draw-call budget is under 150, so new scenery belongs
in an existing batch rather than as its own `Mesh`. Colours come from the `C`
palette in `scene/world/Batch.ts`. Students and vehicles are `InstancedMesh`.

**Three sources of truth must stay in sync.** `COLLIDERS`, `floorHeight()`, and
`cameraCeiling()` in `utils/physics.ts` are hand-maintained to match the geometry
built in `scene/world/`. If you move a wall, a step, or a ceiling there, update
the matching entry in `utils/physics.ts` — the comments there mark which is which.

**Modes are exclusive.** `CampusScene.mode` is `'orbit'`, `'pano'`, or `'walk'`,
and `walking` stays true while a panorama opens from walking. The render loop
early-returns for pano. Controls must stay
frame-rate independent and clamped (fixing two named bugs in the original):
multiply by `dt`, and respect `PITCH_MIN`/`PITCH_MAX`, `ZOOM_MIN`/`ZOOM_MAX`
in `scene/FollowCamera.ts`.

**Panoramas are stored mirrored** by the original app, so they are rendered on
an unflipped sphere. Don't "fix" the winding without checking `scene/PanoViewer.ts`.

Passport progress is `localStorage` under `ccc-campus-passport-v1`. Bump the key
if the shape changes. Accounts, looks, and the passports-issued count live in
Supabase (project `finlclaxrosedfwuyowi`), configured through `.env.local` (see
`.env.example`). Only the anon key belongs in client code, never `service_role`.
`npm run dev` uses the real project once `.env.local` exists. Add `?demo` to the
address to use the local demo backend, which makes its first account an admin.
Hiding admin UI is never the security boundary: RLS and the Edge Function are. Treat everything from other clients as untrusted: pass it through `cleanProfile`.

**Write a dated planning note in `devnote/` before every feature. If an error
appears, investigate, write a note, then fix it.**

## Copyright

`../COPYRIGHT.md` is the project's policy and
`src/components/common/LegalDialog.tsx` mirrors it; the two must agree. Original code, the 3D model, and the Student
Passport design are **© 2026 Manuel Kyd Thomas Nagpala, all rights reserved** —
this is deliberately not open source. The 2022 tour's photos, panoramas, floor
plans, and panel text belong to the original project group; the CCC name and
seal to the college. Google Maps and Street View were **reference only** and no
imagery is stored here — those estimates are to be replaced with survey or
OpenStreetMap data before public release. Keep author and copyright meta tags
in `index.html` intact.
