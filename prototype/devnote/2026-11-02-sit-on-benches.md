# Sit on benches — walk up to a plaza bench and press E to sit

**Date:** 2026-11-02
**Status:** Implemented on `main`, not committed
**Scope:** pure rules in `src/utils/seats.ts`, walking in `src/scene/WalkController.ts`, and a floating hint

---

## Request

A player can sit on a bench. Close to one, a floating message says to press E to sit.

## Decisions and assumptions

- **The 10 plaza benches only.** The lobby's waiting chairs are out of scope.
- **Two seats per bench.** Pressing E takes the nearest free seat within 1.8 m.
- **The hint floats above the seat in the 3D world,** and doesn't sit in the fixed HUD. Touch screens say "Tap Sit" and get a button, because they have no E key.
- **E sits before it checks in.** Both use E. No check-in area reaches a bench today: the closest check-in spot is 14.7 m from a seat, and overlap would need under 9.3 m. The rule only matters if a location or bench moves, and then only one action is on offer.
- **E, moving, or jumping stands up.** A key or joystick already held when sitting down has to be let go first, or walking up to a bench and pressing E would stand straight back up.
- **Other students see it.** The position message carries a seat number, and each browser looks up that seat's position in its own list, so a hostile client can't place a figure anywhere new this way.
- **A taken seat isn't offered,** based on what other students' browsers report.

## Design

```text
walking ──near a free seat──► hint floats above it ──E / Sit──► seated
   ▲                                                              │
   └──────────────── E / Stand / move / jump ─────────────────────┘
```

- **`utils/seats.ts`** holds `BENCHES`, `SEATS`, `nearestSeat`, and `cleanSeat`. `world/ground.ts` draws from `BENCHES`, so the bench and its seats can't drift apart.
- **`WalkController`** gains `seat` and `nearSeat`. While seated it skips movement and gravity.
- **`figure.ts`** gains `sitLimbs`: legs forward and hands on the knees, in the blocky Minecraft-like style of the figures.
- **Sit animation,** added at the project owner's request during the build. Sitting eases over 0.45 s: the figure turns, moves onto the seat, lowers, and bends its legs. Standing reverses over 0.35 s. At rest the legs keep a small swing. Pressing E mid-way reverses from where the figure has got to. Other students see the same ease, blended on their own screen.
- **`SeatHint`** is one DOM element in `#bubbles`, moved each frame like name bubbles. It reports through `onSeatChange` only when something changes, never per frame.
- **`OnlinePlayers`** reads the seat number, poses the figure, and reports which seats are taken.

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `src/utils/seats.ts`, `seats.test.ts` | New | Bench and seat data and rules |
| `src/scene/SeatHint.ts` | New | The floating message |
| `src/scene/WalkController.ts` | Modified | Sitting and standing |
| `src/scene/characters/figure.ts` | Modified | The sitting pose |
| `src/scene/world/ground.ts` | Modified | Draws benches from the shared data |
| `src/scene/OnlinePlayers.ts` | Modified | Sends and shows other students sitting |
| `src/scene/CampusScene.ts`, `src/hooks/useCampusScene.ts`, `src/types/scene.ts`, `src/types/backend.ts` | Modified | The E key, events, and the seat in `Move` |
| `src/components/campus/WalkHud.tsx`, `TouchControls.tsx`, `CampusPage.tsx`, `src/styles/campus.css` | Modified | Prompts and the touch button |
| `tests/e2e/seats.spec.ts` | New | Sitting in a real browser |

### Data

None. No tables or migrations. `Move` gains an optional `s` seat number on the existing channel.

## Test plan

| Case | Type | Expectation |
|---|---|---|
| Every seat | unit | On the paving, facing the plaza, with a clear place to stand |
| Near a seat, far from one, seat taken | unit | Nearest free seat, or none |
| Hostile seat numbers | unit | Refused |
| Sitting and standing | e2e | Pass through in-between poses and heights, rather than snapping |
| E pressed mid-sit | e2e | Reverses, and ends standing |
| Walk close | e2e | Hint shows, and hides on walking away |
| Press E | e2e | Seated at the seat, in the sitting pose, and doesn't fall |
| Press E, move, or jump | e2e | Stands up, clear of the bench |
| Held key while sitting | e2e | Stays seated until released |
| E at a bench, then at a check-in spot | e2e | Sits without stamping, then stamps |
| Exit walking while seated | e2e | Stands |
| Two students | e2e | The other sees the pose, the seat isn't offered, and it's free again after standing |
| Hostile seat number on the channel | e2e | Figure stays put |
| Phone | e2e | Sit and Stand buttons work |

## Out of scope

Lobby chairs, bench collisions (walkers already pass through benches), and NPCs sitting.

---

## Outcome

- **Commands:** `npm run typecheck`, `npx vitest run`, `npx playwright test`, `npx vite build`
- **Result:** type checking clean. Vitest 87 passed, 0 failed, 0 skipped (7 files, 17 of them new). Playwright 25 passed, 0 failed, 0 skipped (7 of them new).
- **Coverage:** not measured, because the project has no coverage tool.
- **CLAUDE.md:** the layout table now lists `seats.ts`. `src/scene/CLAUDE.md` is untracked and was left alone.

### Checked

Screenshots confirmed the floating hint, a figure midway through sitting, and the seated pose. Browser tests confirmed the in-between poses, standing three ways, two students on the demo backend, and the phone buttons.

### Problems found while building

- **E failed right after standing up:** the nearby seat was only worked out on the next frame. It is now set the moment standing finishes.
- **A wrong assumption in the plan:** it said check-in areas overlap benches. Measured, the closest check-in spot is 14.7 m from a seat, so the test now checks E at a bench and at a check-in spot separately.

### Not checked

- Two real accounts on the live Supabase channel. `s` is one more field on the existing move message, so no setup change should be needed.
- A real phone. Touch was simulated.
- Long names or a voice icon above a seated figure. Their height follows the figure, and they weren't checked by eye.

### Outstanding

Walkers still pass through benches, as they did before. A student can also sit on a seat that another student took at the same moment, because seats are only checked in each browser.
