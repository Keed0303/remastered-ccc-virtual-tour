# React + Vite + TypeScript migration — analysis and plan

**Date:** 2026-11-02
**Status:** Migrated on branch `feat/react-typescript-migration`; not merged or pushed. Live write checks remain for the project owner.
**Scope:** All of `prototype/`, except the Supabase server code and database

---

## Request

Move the project from plain JavaScript to React, Vite, and TypeScript, using `src/components`, `src/hooks`, `src/scene`, `src/utils`, `src/types`, `src/styles`, plus `src/main.tsx` and `src/App.tsx`. Analyze first and wait for approval.

## How the app fits together

```text
index.html (83 ids) ──► main.js ──┬─ data.js     content, colliders, floor heights, settings rules
style.css                         ├─ world.js    all procedural geometry and character figures
                                  ├─ online.js   other players and name bubbles
                                  ├─ account.js  login, register, customization, 3D preview
                                  └─ backend.js  Supabase or demo backend

admin.html (54 ids) ──► admin.js ─┬─ backend.js
admin.css                         └─ data.js

Supabase: Auth, profiles, app_settings, Realtime channel, admin-users Edge Function
```

`main.js` does most of the work. It runs on import, finds elements by id, creates the renderer, builds the scene, attaches listeners, and starts one render loop. Fifteen sections share about 20 module-level variables.

## Current file mapping

| Current file | Lines | Becomes |
|---|---:|---|
| `index.html` | 189 | `index.html` shell, plus the campus components |
| `admin.html` | 144 | Admin components |
| `src/main.js` | 982 | Split across `scene/`, `hooks/`, `components/` (below) |
| `src/world.js` | 1,073 | `scene/world/*` and `scene/characters/figure.ts` |
| `src/data.js` | 290 | `utils/campusData.ts`, `utils/physics.ts`, `utils/validation.ts`, `types/` |
| `src/online.js` | 148 | `scene/OnlinePlayers.ts`, `hooks/useCampusPresence.ts`, `NameBubbles.tsx` |
| `src/account.js` | 247 | `components/account/*`, `hooks/useCharacterPreview.ts` |
| `src/admin.js` | 280 | `components/admin/*`, `hooks/useAdminUsers.ts` |
| `src/backend.js` | 298 | `utils/backend/{index,supabase,demo}.ts`, `types/backend.ts` |
| `src/style.css`, `src/admin.css` | 242, 117 | `styles/campus.css`, `styles/admin.css` |
| `vite.config.js` | 10 | `vite.config.ts` with the React plugin |
| `package.json`, `package-lock.json` | | Add React and TypeScript dependencies |
| `.env.example`, `.env.local`, `.gitignore` | | Kept. Add `src/vite-env.d.ts` for typed variables |
| `public/panos/*.jpg` (12) | | Unchanged |
| `supabase/**` | | Unchanged; excluded from the app's TypeScript config |
| `devnote/**`, `../COPYRIGHT.md` | | Unchanged |
| `CLAUDE.md` | 121 | Updated: layout and "all DOM is in `index.html`" no longer hold |

### `src/main.js` sections

| Section | Becomes |
|---|---|
| Renderer, scene, lights | `scene/CampusScene.ts` |
| People and vehicles | `scene/Npcs.ts`, `scene/Traffic.ts` |
| Saved game state | `hooks/usePassport.ts`, `utils/passport.ts` |
| Views, tweening, floors | `scene/CameraRig.ts`, `Views.tsx` |
| Floating labels | `scene/LabelProjector.ts`, `CampusLabels.tsx` |
| Info card | `InfoCard.tsx` |
| 360° viewer | `scene/PanoViewer.ts`, `PanoOverlay.tsx` |
| On-foot mode | `scene/WalkController.ts`, `WalkHud.tsx` |
| Touch controls | `TouchControls.tsx`, `hooks/useJoystick.ts` |
| Third-person camera | `scene/FollowCamera.ts` |
| Themes and toggles | `scene/Environment.ts`, `ThemePicker.tsx`, `LayerToggles.tsx` |
| Clicking buildings and rooms | `scene/Picking.ts`, `RoomTip.tsx` |
| Main loop | `CampusScene.start()` and `stop()` |
| Site settings | `hooks/useSiteSettings.ts` |
| Accounts and other students | `hooks/useAuth.ts`, `hooks/useCampusPresence.ts` |

## Hard parts

### High risk

1. **`main.js` runs on import and has no shutdown.** React needs to mount and unmount it. Everything has to move into a class with `start()` and `dispose()`.
2. **No cleanup exists today.** `buildWorld` has no dispose. The renderer, render loop, OrbitControls, shadow map, canvas textures, merged geometries, materials, point lights, and 8 window or document listeners are never released. Only the character preview and remote figures clean up.
3. **React Strict Mode mounts twice in development.** Without perfect cleanup, this creates two WebGL contexts, two loops, and duplicate presence channels.
4. **60 fps state must stay outside React.** Keys, joystick, camera, player position, NPC matrices, and label positions must not use `useState`. Re-rendering every frame would hurt performance.
5. **Per-frame DOM writes.** Labels and name bubbles set `style.transform` every frame. They stay imperative through refs, with React rendering only the list.
6. **Modes are spread across many variables.** `mode`, `walkActive`, `tween`, `controls.enabled`, and body classes must stay in sync. A single typed state machine should replace them.

### Medium risk

7. **Hidden ordering.** `main.js` relies on function hoisting and shared variables across sections, so splitting it will expose circular dependencies.
8. **Imperative DOM.** There are 183 `$()` calls, 24 `createElement` calls, and 48 assigned handlers or listeners. This also includes `<dialog>`, focus handling, toasts, and confetti.
9. **Input edge cases.** Pointer lock, the first-Esc rule, separate joystick and look fingers, and the guard against typing into forms all need regression checks.
10. **Backend types.** There are two implementations, the demo uses `this`, and untrusted Realtime payloads should be `unknown` until cleaned. `?demo` must keep working.
11. **The preview adds a second WebGL renderer.** It needs safe open and close handling, especially under Strict Mode.
12. **Three.js typing.** `userData.legL`, `.isMesh` checks, batch attributes, and `three/addons` imports need explicit types.
13. **CSS depends on ids and body classes.** `.walking`, `.in-pano`, and `.passport-open` all rely on `body`. Keep the ids and manage the classes from one hook.

### Lower risk

14. **Pure logic** in `data.js`, the geometry helpers, and validation converts almost directly.
15. **`window.__ccc`** currently ships to production. Limit it to development builds.
16. **Regression checks are manual.** There's no test suite, so this migration has no automatic safety net.
17. **Admin features are still untested live** while logged in. Confirm them before migrating, so old and new bugs aren't confused.

## Proposed file tree

```text
prototype/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.node.json
├─ public/panos/
├─ supabase/                     unchanged
├─ devnote/                      unchanged
└─ src/
   ├─ main.tsx
   ├─ App.tsx                    routes: campus, lazy admin
   ├─ vite-env.d.ts
   ├─ components/
   │  ├─ campus/
   │  │  ├─ CampusPage.tsx
   │  │  ├─ CampusCanvas.tsx
   │  │  ├─ SidePanel.tsx
   │  │  ├─ Views.tsx
   │  │  ├─ ThemePicker.tsx
   │  │  ├─ LayerToggles.tsx
   │  │  ├─ StatsPanel.tsx
   │  │  ├─ Compass.tsx
   │  │  ├─ CampusLabels.tsx
   │  │  ├─ NameBubbles.tsx
   │  │  ├─ InfoCard.tsx
   │  │  ├─ QuizPanel.tsx
   │  │  ├─ PanoOverlay.tsx
   │  │  ├─ WalkHud.tsx
   │  │  ├─ TouchControls.tsx
   │  │  └─ RoomTip.tsx
   │  ├─ passport/
   │  │  ├─ PassportPanel.tsx
   │  │  └─ PassportButton.tsx
   │  ├─ account/
   │  │  ├─ AccountDialog.tsx
   │  │  ├─ LoginForm.tsx
   │  │  ├─ RegisterForm.tsx
   │  │  ├─ CharacterCustomizer.tsx
   │  │  ├─ CharacterPreview.tsx
   │  │  └─ AccountMenu.tsx
   │  ├─ admin/
   │  │  ├─ AdminPage.tsx
   │  │  ├─ AdminGate.tsx
   │  │  ├─ DashboardTab.tsx
   │  │  ├─ UsersTab.tsx
   │  │  ├─ UserDialog.tsx
   │  │  ├─ DeleteUserDialog.tsx
   │  │  └─ SettingsTab.tsx
   │  └─ common/
   │     ├─ Dialog.tsx
   │     ├─ Toasts.tsx
   │     ├─ Confetti.tsx
   │     └─ LegalDialog.tsx
   ├─ hooks/
   │  ├─ useCampusScene.ts
   │  ├─ useAuth.ts
   │  ├─ useCampusPresence.ts
   │  ├─ useSiteSettings.ts
   │  ├─ usePassport.ts
   │  ├─ useAdminUsers.ts
   │  ├─ useCharacterPreview.ts
   │  ├─ useJoystick.ts
   │  ├─ useBodyClass.ts
   │  └─ useToast.ts
   ├─ scene/
   │  ├─ CampusScene.ts          owner: start(), stop(), dispose()
   │  ├─ CameraRig.ts
   │  ├─ FollowCamera.ts
   │  ├─ WalkController.ts
   │  ├─ PanoViewer.ts
   │  ├─ Environment.ts
   │  ├─ Npcs.ts
   │  ├─ Traffic.ts
   │  ├─ OnlinePlayers.ts
   │  ├─ LabelProjector.ts
   │  ├─ Picking.ts
   │  ├─ dispose.ts
   │  ├─ characters/figure.ts
   │  └─ world/
   │     ├─ Batch.ts
   │     ├─ buildWorld.ts
   │     ├─ ground.ts
   │     ├─ oldBuilding.ts
   │     ├─ lobby.ts
   │     ├─ blueRoofBlock.ts
   │     ├─ newBuilding.ts
   │     ├─ floors.ts
   │     ├─ props.ts
   │     └─ textures.ts
   ├─ utils/
   │  ├─ campusData.ts
   │  ├─ physics.ts              COLLIDERS, floorHeight, cameraCeiling, indoorBounds
   │  ├─ validation.ts           cleanProfile, cleanSettings, validateRegistration
   │  ├─ passport.ts
   │  └─ backend/
   │     ├─ index.ts
   │     ├─ supabase.ts
   │     └─ demo.ts
   ├─ types/
   │  ├─ campus.ts
   │  ├─ game.ts
   │  ├─ character.ts
   │  ├─ backend.ts
   │  ├─ database.ts
   │  └─ scene.ts
   └─ styles/
      ├─ campus.css
      ├─ account.css
      └─ admin.css
```

## Proposed phases

Each phase ends with a working app and its own commit.

| Phase | Work |
|---|---|
| 0 | Branch, record a behavior checklist, add React and TypeScript with `allowJs` |
| 1 | Convert data, validation, backend, and types |
| 2 | Split `world.js` and add full dispose support |
| 3 | Build `CampusScene` from `main.js`, with no visual change, and run it through `useCampusScene` |
| 4 | Move UI to components: passport, account, admin, cards, controls |
| 5 | Remove `allowJs`, turn on strict rules, delete old files, update `CLAUDE.md` |
| 6 | Full regression on desktop, phone, and live Supabase |

## Recommendations

- Keep imperative Three.js in `src/scene/`, not React Three Fiber. Over 2,000 lines already work this way, and this keeps your requested structure.
- Keep the current CSS at first, and don't redesign during the migration.
- Use React context plus hooks, with no state library. Frame-rate data stays in `CampusScene`.
- Add `vitest` for pure logic and a Playwright smoke test, if a test dependency is acceptable.

## Known versions

Checked 2026-11-02: React 19.3.1, TypeScript 7.0.2, `@vitejs/plugin-react` 6.1.2, `@types/three` 0.187.0. Compatibility between TypeScript 7 and these tools still needs confirming in phase 0.

## Decisions

1. One app with routes, with the admin page loaded on demand.
2. Plain Three.js in `src/scene/`, not React Three Fiber.
3. Work on a branch inside `prototype/`, with one commit per phase. Nothing is pushed unless requested.
4. Add Vitest for logic and a Playwright smoke test.
5. The live admin checks have not been run, so they stay on the checklist below and can't be used as a baseline.

## Behavior checklist

Each item must work the same after migration. Items marked (live) need a real login by the project owner.

- Orbit view, all seven camera views, labels, click a building, click a room
- Info card, check-in, quiz, 360° viewer, passport, badges, reset, saved progress
- Themes and all four layer toggles
- Walking: third-person camera, mouse look, zoom, collisions, stairs, jump, lobby, indoor label hiding
- Phone: Passport button, joystick, Jump, Check in, landscape
- Register, customize, log in, log out, session restore (live), `?demo`
- Other players, name bubbles, online count, passport count (live)
- Admin gate, dashboard, users, settings, live settings updates (live)
- Copyright dialog and meta tags

## Out of scope

Visual redesign, new features, database changes, and Edge Function changes.

---

## Outcome

The app now runs on React 19, Vite 8, TypeScript 7 (strict), and React Router 7, with no JavaScript left in `src/`. Each phase has its own commit.

### Test results

These ran on the final code, 2026-11-02:

- `npm run typecheck`: no errors, with no `any` in `src/`
- `npm test`: 33 of 33 passed in 4 files
- `npm run test:e2e`: 13 of 13 passed in Chrome with software WebGL, on the demo backend

Those tests cover views, themes, layers, the info card, quiz, 360° viewer, walking physics, indoor label hiding, register, customize, log in, session restore, two students seeing each other, a hostile name staying plain text, admin users and settings with live updates, the student refusal, the phone controls, and the single canvas under Strict Mode.

### Checked against the original

Old and new were captured side by side at 1280×800 and 390×844 for the overview, a floor, the card, walking, and the phone. The layout matches. Pixel differences come from random students and cars, and from camera timing in the card shot.

### Checked live

- **Logged out, dev and production builds:** the campus and admin login load with no console errors. `passport_count` and `app_settings` return 200, and `window.__ccc` is absent in production.
- **Logged in, read-only:** the browser pane already held the project owner's admin session. In it, the new admin page listed users through the Edge Function, read settings, and counted who is online. So the "Verify JWT" setting isn't blocking the function today. Nothing was changed.

### Not checked

- Live sign-up, log in, log out, and saving a character
- Live user create, edit, and delete, and saving settings
- Two real accounts seeing each other through Supabase Realtime
- Frame rate on a real phone, and real touch input. Touch was simulated.

### Differences from the plan

- **Phase 3 ran through a temporary `main.js` bridge,** not `useCampusScene`, so the phase could end working without React. Phase 4 removed the bridge and added the hook.
- **Pages link with full page loads.** `campus.css` and `admin.css` style the same elements differently, and a stylesheet stays loaded after client-side navigation. Hosting must serve `index.html` for `/admin`.
- **`NameBubbles.tsx` renders only the container.** `OnlinePlayers` still creates the bubbles, because they move every frame. Names use `textContent`.
- **Added:** `usePassportCount`, `utils/layers.ts`, and `tests/e2e/`.
- **Vitest is 3.2.7, not 5.** Vitest 5 excludes Node 23, and npm failed with an unclear `edgesOut` error when it was forced. Vitest keeps its own Vite 7 for tests.
- **Small visible changes:** the legal dialog and `COPYRIGHT.md` now credit React and React Router.
- **Replaced deprecated Three.js calls:** `Timer` instead of `Clock`, and `PCFShadowMap` instead of the removed soft shadow type, which Three.js was already substituting.

### Problems found during the migration

- **Startup error in the bridge:** the scene reports its first view while it is being constructed, and the handler read passport state that wasn't created yet. React avoids this because state exists before the effect runs.
- **Incomplete phase 2 commit:** a failed `git add` left out the new files. The local commit was corrected before anything was pushed.
- **Realtime channels under Strict Mode:** the client reuses a channel that is still closing, so joins and leaves now run through a promise queue.

### Open items

- The site's live settings currently hide all four layers, with 8 NPCs. That was already saved before these checks and wasn't changed, but every visitor sees it.
- A missing `favicon.ico` logs a 404. This was already the case, and the tests ignore it.
- The campus chunk is 661 kB (173 kB gzipped), mostly Three.js and the scene.
