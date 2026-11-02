# Street View survey of the campus block route

**Date:** 2026-11-03
**Status:** Investigation only. No code changed.

**Main finding:** the street-facing buildings in the 3D campus match what's there. The errors are in the layout: the block's shape, the plaza's surroundings, and treating the block's south and east edges as open campus when private houses and city offices stand there.

## How this was checked

- **Route:** the Google Maps directions link from the project owner, opened in their Chrome.
- **Views:** 24 Street View positions along the blue line, with the camera turned toward the buildings, plus one satellite view. This samples the route and isn't a continuous walk.
- **Imagery dates:** January 2026 on the north half and at the Health Office, and August 2024 on the south half. Some details may have changed.
- **Compared with:** `remaster-plan.md` and `src/scene/world/`.
- **Limits:** Street View can't see rear walls, interiors, or courtyards. Distances other than Google's route figures are measured from the screen using the map's scale bar, so they're rough.

No Street View images were saved, following the project's rule in `remaster-plan.md`.

## The route

The blue line is a 500 m loop around the campus block by motorcycle. The fixed stop on S.V. Rizal St forces the loop. The pin and destination are only about 60 m apart, so the loop is useful for exploring but not as a real way to get there.

| # | Direction | Distance | What it passes |
|---|---|---:|---|
| 1 | West along Barreto St from the portico | 24 m | Old Building front wing and stairs, with the plaza opposite |
| 2 | South on S.V. Rizal St | 150 m | Old Building side, blue-roof building, New Building, corner shops |
| 3 | East on Brosas St | 83 m | Private houses and a walled lot on both sides |
| 4 | North on Barreto St, curving west | 190 m | Private houses, a blue and white block, Health Office, eateries, coffee shop |
| 5 | North on S.V. Rizal St | 34 m | Plaza fence on the east, shops on the west, ending at the Kappu Potet'o pin |

## What's on the block, going around

| Place | What's visible | CCC? |
|---|---|---|
| **Old Building front** (44 Barreto St) | White wing, blue bands, blue walls between arched windows, portico, terracotta stairs, blue planters, black lantern posts | Yes, signed |
| **Old Building, S.V. Rizal side** | Long white wall, same blue bands and arched windows, air conditioners, a side door under a brown metal awning, and a dense row of motorcycles and tricycles | Yes, by its look |
| **Blue-roof building** (221 S.V. Rizal St) | Heavy concrete band, concrete columns, wide stairs, pale blue lower wall, graduation banners | Yes, confirmed by the project owner |
| **New Building** (223 S.V. Rizal St) | Three storeys, arched iron grilles, blue grid, small parking forecourt, and the sign "City College of Calamba, Mayor Joaquin Chipeco Jr. Bldg." | Yes, signed |
| **Corner shops, S.V. Rizal and Brosas** | A row of small stalls and a sari-sari store below the New Building's blank south wall, a large tree, and tricycles | No |
| **Brosas St, north side** | Private houses behind walls, and a large building with a white wall and an orange band | No, by its look |
| **Barreto and Brosas corner** (112 Barreto St) | A large stone and brick private house | No, by its look |
| **East side, south part** | A tall blue and white block with its own side door. **Unidentified:** it could belong to the health complex | Unknown |
| **East side, middle** (4027 Barreto St) | Sign reading "Calamba City Health Office", with waiting patients and an ambulance. Maps also lists a birthing facility and a clinic here | No |
| **Psalm 23:5 Coffee** (north end of the east side) | A café with a timber fence and a "student lounge" sign, beside a white wall with a round green seal | No, though students may use it |

## What's around the block

| Place | What's visible |
|---|---|
| **Plaza** | Labelled "The View: Old Municipal Plaza" and "Rizal Monument" on Maps. Brick paving, a timber pergola with tables and benches, and a flagpole |
| **Plaza's S.V. Rizal edge** | Sidewalk, a low white planter wall, an iron fence between brick and white pillars, and a large brick and white arch near the north corner. The plaza's grounds reach this street |
| **Plaza's Barreto edge** | Brick sidewalk, white planters, and a small blue grille kiosk with a red roof. Maps lists a Police Community Precinct here, so it may be that. **Not confirmed** |
| **West side of S.V. Rizal St** | MJ Store (crowded with students), Raquel's Pancit Malabon in green, a blue shop, and more trees. Kappu Potet'o's own storefront wasn't identifiable |
| **East side of Barreto St** | Liza's Eatery, copy shops, and small eateries, with Juliano St branching off |
| **Across Brosas St** | A row of older two-storey townhouses, and Alfamart at the S.V. Rizal corner |
| **North of the plaza** | Burgos St, and a stone-walled, red-roofed building that's visible but wasn't identified |

## Compared with the 3D campus

### Already correct

- Old Building front: white wing, portico, stairs, wedge planters, and lantern posts
- Blue-roof building: concrete band, columns, stairs, and banners
- New Building: arcade, three storeys, and both lines of its sign
- Cream two-storey building across S.V. Rizal St at the end of Barreto St
- West side of the block: the model's 151 m is close to Google's 150 m

### Differences

| # | Priority | Real place | Model | Where |
|---|---|---|---|---|
| 1 | **High** | **Barreto St curves** at the north-east corner, and the east and west streets aren't parallel. The block narrows to the north | Straight roads in a rectangle with a sharp corner | `ground.ts:17-20` |
| 2 | **High** | **North and east sides total about 190 m** by the route | About 226 m along the road centre lines, roughly 19% long. The curve explains only part of this | `ground.ts:18-19` |
| 3 | **High** | **No building stands between S.V. Rizal St and the plaza.** It's a fence, trees, and an arch | A neighbour block stands at x −2 to 10, and the plaza stops at x 18 | `ground.ts:28`, `ground.ts:128` |
| 4 | **High** | **The block's south and south-east parts are private** houses and shops | Campus paving covers the whole block up to both streets | `ground.ts:25` |
| 5 | **Medium** | **Brosas St side is about 83 m** | About 75 m | `ground.ts:17-19` |
| 6 | **Medium** | **Plaza depth looks closer to 45–50 m** from Barreto St to Burgos St (rough) | 67 m, ending at z −125 | `ground.ts:30` |
| 7 | **Medium** | **Burgos St** runs along the plaza's north side | No street there | `ground.ts:17-20` |
| 8 | **Medium** | **Pergola with tables,** and a **brick and white arch** on the S.V. Rizal side | Neither is present | `ground.ts:74-105` |
| 9 | **Medium** | **Corner shops seem to face S.V. Rizal St,** next to a large tree | A row facing Brosas St against the south wall | `ground.ts:165` |
| 10 | **Low** | **Motorcycles** crowd the Old Building's side wall, and there's a **brown side awning** | Tricycles only | `ground.ts:163` |
| 11 | **Low** | **Small blue kiosk** on the plaza's Barreto edge | Not present | `ground.ts` |
| 12 | **Low** | **Portico columns** look grey-veined up close in January 2026 | White | `oldBuilding.ts:41` |
| 13 | **Low** | **A short driveway** with parking marks in front of the east wing | Not seen in the world code's comments, so check it in the app | `oldBuilding.ts` |
| 14 | **Low** | **Shop row west of S.V. Rizal St** next to the plaza, a likely student hangout | Plain pale blocks | `ground.ts:126` |
| 15 | **Low** | **East strip** runs from private house to blue block to Health Office to café | Two plain white and blue blocks | `ground.ts:134` |

**Confidence:** items 1–4 are clear from both the map and street level. Items 5 and 2 use Google's route distances, which follow the road and not the walls. Item 6 is measured from the screen, and item 9 is judged from camera angles. Both need checking on site.

## Questions this answers

- **"JMC" is confirmed as the Mayor Joaquin Chipeco Jr. Building.** The sign reads that way, and the code already uses it.
- **The Health Office is a city office, not part of CCC.** The sign on it says so, and the plan already treats it as a neighbour.
- **Not all of the block is CCC.** The plan's "campus block" wording should change, since the campus doesn't fill it.

## Still unknown

- Where CCC's land ends on the south and east sides
- What the tall blue and white block on Barreto St is, and who owns the orange-banded building near Brosas St
- Whether the kiosk is the police precinct
- The rear of all three CCC buildings
- Whether anything has changed on the south half since August 2024

## Recommended fixes

In order, if the model is updated:

1. **Reshape the streets:** curved Barreto St, tapered block, and correct side lengths. Other positions depend on this, so it comes first.
2. **Fix the campus boundary:** limit campus paving to CCC's land, and add plain private lots to the south and south-east.
3. **Rework the plaza:** remove the false neighbour block, extend the grounds to S.V. Rizal St, correct the depth, and add Burgos St.
4. **Add the landmarks:** pergola, west arch, kiosk, and corner shops.

Moving the streets could shift walk collisions, bench seats, and the 3D labels, so `tests/e2e/seats.spec.ts` and the regression tests would need rerunning.

**Data source warning:** `remaster-plan.md` says Google Maps and Street View are for reference only, and that their terms restrict tracing and derived content. It also says to replace these estimates with survey or OpenStreetMap data before public release, and the site is already public. Use these findings to decide what to fix, but take the final shapes and distances from OpenStreetMap or a site survey. Check with your adviser about academic use.

---

## Revision — 2026-11-03: fixing the block shape and campus boundary

The project owner approved fixes 1 and 2, using OpenStreetMap. This section was written before the code changed.

### Source

OpenStreetMap, downloaded through Overpass on 2026-11-03 (data as of 2026-11-02), © OpenStreetMap contributors, ODbL. The ways used are Barretto Street, Brosas Street, and S. V. Rizal Street, plus the City College of Calamba area and its building outlines.

### What OpenStreetMap shows

Fitted to the model's three street junctions, with a rotation of about 18° and no scaling:

| Measure | OpenStreetMap | Model before |
|---|---:|---:|
| Barreto St, S.V. Rizal St to Brosas St | About 204 m | 226 m |
| Brosas St, S.V. Rizal St to Barreto St | About 86 m | 75 m |
| S.V. Rizal St, Barreto St to Brosas St | About 145 m | 151 m |
| Old Building outline | About 55 × 36 m | About 62 × 52 m |
| New Building outline | About 44 × 24 m | 44 × 38 m |

**The buildings are too big, so the streets can't take their exact OpenStreetMap positions without running through them.** Fixing that means moving buildings, which wasn't part of this approval.

### Plan

The streets take OpenStreetMap's shape, adjusted only as far as needed to clear the existing buildings.

| File | Change |
|---|---|
| `utils/streets.ts` (new) | Street paths, campus land outline, and path helpers, with tests |
| `world/ground.ts` | Curved Barreto St, angled Brosas St, and no false Barreto St extensions. Campus paving covers only CCC land. Plain lots and two houses fill the rest of the block. Neighbouring blocks on the east move clear of the road |
| `Traffic.ts` | Cars follow the new paths and drive on the right |
| `utils/physics.ts` | Walk limit reaches the new road. Colliders added for the new houses and east blocks |
| `LegalDialog.tsx`, `COPYRIGHT.md` | OpenStreetMap credit |

### Left alone

The buildings, plaza, benches, seats, floor plans, and walking student paths don't change, so differences 3, 6, 7, 8, and 9 stay open. S.V. Rizal St's bend north of General Lim St also stays out, because the road would run through the plaza's false neighbour block.

### Outcome

| Measure | OpenStreetMap | Before | Now |
|---|---:|---:|---:|
| Barreto St, S.V. Rizal St to Brosas St | About 204 m | 226 m | 214 m |
| Brosas St, S.V. Rizal St to Barreto St | About 86 m | 75 m | 83 m |
| S.V. Rizal St, Barreto St to Brosas St | About 145 m | 151 m | About 154 m |

- **Barreto St** now curves, and the block narrows to the north. It no longer runs past S.V. Rizal St to the west, or straight on to the east.
- **Brosas St** now runs at an angle, stops at Barreto St, and no longer continues east. Jose Yulo Sr. St isn't added yet.
- **Campus paving** now covers only CCC's land. Plain lots and two simple houses fill the rest of the block.
- **S.V. Rizal St got about 3 m longer, away from the real length.** The New Building is about 14 m too deep, so Brosas St can't move north without moving that building.
- **The road is still 3–8 m further from some real positions.** Barreto St bends around the Old Building's east wing, which is larger than its OpenStreetMap outline.
- **The CCC land outline fits the model's buildings, not OpenStreetMap's area exactly.** It isn't a legal boundary, and the project still needs the college's own site plan.

**Results:** type checking is clean. Vitest passed 101 of 101, including 14 new tests. Playwright passed 21 of 21 in the regression, seats, and smoke files. The voice files weren't run, because voice didn't change. After the last adjustment of under 1 m, the road was checked by tests, not by eye.

## Revision — 2026-11-03: plaza differences closed

Differences 3, 6, 7, 8, and 11 are fixed by the 2026 plaza rebuild, along with S.V. Rizal St's bend and part of 14. See [the plaza note](2026-11-03-plaza-2026.md). Difference 9 stays open.
