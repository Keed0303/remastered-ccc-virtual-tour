# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A Three.js prototype for the **CCC Virtual Tour V2** remaster — a gamified 3D
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
npm run dev      # Vite dev server on :5173
npm run build    # -> dist/
npm run preview  # serve dist/ on :5173
```

There is **no test suite, linter, or formatter** configured. `src/main.js` ends
by exposing `window.__ccc` (camera, controls, scene, world, avatar, keys,
`mode`, `game`, `setView`, `selectLocation`, `stepWalk`, `stepCamera`,
`floorHeight`, `online`, `stick`, `profile`, …) specifically so a browser-driven harness can step the
simulation deterministically — use that hook if you add automated checks.

Note: the user-level `/implement-features` skill describes a different project
(Next.js + Supabase + Jest + TypeScript). Its stack-specific instructions do not
apply here; this is plain ES modules with no build-time type checking.

## Layout

| File | Role |
|---|---|
| `index.html` | All DOM. Every panel, dialog, and HUD element is static markup with an `id`; JS only fills and toggles them. |
| `src/data.js` | **All content and all campus geometry constants.** Floor plans, locations, quizzes, badges, camera views, themes, colliders, floor-height functions. |
| `src/world.js` | Procedural geometry. Builds the ground, three buildings, the walk-in lobby, floor-plan meshes, the flag, and the blocky student figures. |
| `src/main.js` | Everything else: renderer, orbit/pano/walk modes, labels, cards, passport state, themes, layer toggles, picking, the render loop. |
| `src/backend.js` | Accounts and presence behind one interface: Supabase when configured, or a local demo in `npm run dev`. |
| `src/account.js` | Log in, register, and character customization screens. |
| `src/online.js` | Other logged-in students: figures, interpolation, name bubbles. |
| `supabase/migrations/` | Append-only database changes. Apply in the Supabase SQL editor or with `supabase db push`. |
| `src/style.css` | Single stylesheet, CSS custom properties in `:root`. |
| `admin.html`, `src/admin.js`, `src/admin.css` | Role-protected admin page: dashboard, users, and site settings. |
| `supabase/functions/admin-users/` | Edge Function for account changes. The only code allowed to use `service_role`. |
| `public/panos/*.jpg` | The 12 original panoramas in use (of 52 available). |

## Conventions that matter

**Content lives in data, not code.** This is the central rule carried over from
the plan, and the fix for the original app's 3,286 lines of hand-wired
navigation. Adding a location should mean one entry in `LOCATIONS` and nothing
else — no new function, no new DOM. The same applies to `FLOORS`, `VIEWS`,
`THEMES`, `BADGES`, and the layer `toggles` list in `main.js`: they are rendered
by mapping over the array.

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

**Geometry is batched.** `world.js` uses the `Batch` class: accumulate coloured
boxes/cylinders/quads, then `build(material)` merges them into one
`vertexColors` mesh. The draw-call budget is under 150, so new scenery belongs
in an existing batch rather than as its own `Mesh`. Colours come from the `C`
palette at the top of `world.js`. Students and vehicles are `InstancedMesh`.

**Three sources of truth must stay in sync.** `COLLIDERS`, `floorHeight()`, and
`cameraCeiling()` in `data.js` are hand-maintained to match the geometry built
in `world.js`. If you move a wall, a step, or a ceiling in `world.js`, update
the matching entry in `data.js` — the comments there mark which is which.

**Modes are exclusive.** `mode` is `'orbit'`, `'pano'`, or walking
(`walkActive`). The render loop early-returns for pano. Controls must stay
frame-rate independent and clamped (fixing two named bugs in the original):
multiply by `dt`, and respect `PITCH_MIN`/`PITCH_MAX`, `ZOOM_MIN`/`ZOOM_MAX`.

**Panoramas are stored mirrored** by the original app, so they are rendered on
an unflipped sphere. Don't "fix" the winding without checking `openPano`.

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

`../COPYRIGHT.md` is the project's policy and `index.html` mirrors it in the
legal dialog; the two must agree. Original code, the 3D model, and the Student
Passport design are **© 2026 Manuel Kyd Thomas Nagpala, all rights reserved** —
this is deliberately not open source. The 2022 tour's photos, panoramas, floor
plans, and panel text belong to the original project group; the CCC name and
seal to the college. Google Maps and Street View were **reference only** and no
imagery is stored here — those estimates are to be replaced with survey or
OpenStreetMap data before public release. Keep author and copyright meta tags
in `index.html` intact.
