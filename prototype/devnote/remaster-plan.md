# CCC Virtual Tour Remaster: Project Plan

**Goal:** turn the original 360° tour into a gamified 3D website of City College of Calamba, using the reference [Ecomdy Office 3D](https://ecomdy-office.vercel.app/) as the visual starting point.

**Related:** [investigation of the original app](ccc-virtual-tour-investigation.md) · [sample build](prototype/)

## 1. Recommendation

**Yes, recreating every building and room in 3D is possible, but build it in stages.** Start with a stylized campus diorama, keep the real 360° photos inside it, and replace rooms with full 3D models as time allows.

Building all rooms first would be risky. The original covers about 70 named spaces, and accurate 3D needs measurements that don't exist yet. The staged approach means there is a complete, testable website at every point, which also protects the thesis schedule.

| Stage | What the user gets | Rooms in true 3D |
|---|---|---|
| **A. Diorama + 360°** (sample built) | Whole campus in 3D, cutaway floors, real photos, quests | None, floor layouts only |
| **B. Key rooms** | Walk into the most important spaces | 8–12 |
| **C. Room kit** | Classrooms and labs built from reusable parts | About 40 |
| **D. Full campus** | Every accessible room | All surveyed rooms |

**Minimum for the thesis:** Stage B. Stages C and D are stretch goals.

## 2. Technology

WebGPU, WebAssembly, and Three.js are not alternatives. They do different jobs and can work together.

| Technology | Role | Decision |
|---|---|---|
| **Three.js** | 3D engine: scene, camera, models, lighting | **Core of the project** |
| **WebGL 2** | Graphics API that runs on nearly every browser and school PC | **Default renderer** |
| **WebGPU** | Newer graphics API, faster for heavy scenes | **Optional later**, through `WebGPURenderer` with WebGL 2 fallback |
| **WebAssembly** | Fast compiled code for specific tasks | **Use only through libraries**: Rapier physics, Draco and KTX2 decoders |
| **Vite** | Build and development server | Yes |
| **Blender** | Modelling rooms and exporting glTF | Yes, from Stage B |

**Why not write the game in WebAssembly directly?** It would add a lot of engine work without improving what visitors see. Most of the demand here is in rendering and asset size, which good compression and Three.js handle.

**Why not only WebGPU?** School and visitor devices may not support it, so requiring it would shut out some users. WebGL 2 stays the baseline.

## 3. Campus layout

These measurements were estimated from the Google Maps satellite view, using its scale bar (10 m = 67 px at the zoom used), then corrected against Street View and the original tour's photos. The campus grid is rotated about 25° from true north. **All values are approximate until checked on site.**

| Feature | Local position (m) | Size | Confidence |
|---|---|---|---|
| Old Building, front wing, rear wings, and courtyard | x −5 to 57, z −46 to 6 | About 62 × 44 m plus portico | Medium |
| CCC blue-roof building with courtyard (confirmed part of CCC) | x 0 to 47, z 6 to 50 | About 47 × 44 m | Medium for shape, high for identity |
| New Building (JMC) | x 0 to 44, z 52 to 90 | About 44 × 38 m | Medium |
| Rizal Plaza and monument | x 18 to 50, z −125 to −58 | About 32 × 67 m | Medium |
| S.V. Rizal St (west) · Barreto St (north, east) · Brosas St (south) | Around the block | | High |

### Street-level findings

Sources: Street View (imagery from August 2024 and January 2026), spheres 1–4 of the original tour, and its two building photos.

| Place | What the real place looks like | Change made to the sample |
|---|---|---|
| Old Building front | Low white wing with two blue bands and a parapet hiding the roof, stepped end sections, blue walls between windows | Rebuilt |
| Portico | Two white round columns, white pediment with blue edge, seal, raised lettering, blue beams, recessed white and blue entrance | Rebuilt |
| Stairs and planters | Wide terracotta stairs open directly onto Barreto St, between sloped blue planters with shrubs and palms | Rebuilt, street moved next to the steps |
| Plaza | Dark metal arches on stone and blue pillars at the far end, flagpole on a round blue base, stone paving with cream panels, terracotta and grey rings at the monument, iron fence, blue benches and bins | Rebuilt |
| Monument | Dark bronze standing figure, with floral wreaths around its base | Rebuilt |
| New Building | West front only: arched iron grilles and blue piers, metal awning, two window floors in a cyan grid, air conditioners, white top band with red lettering. South wall is blank white, with small shops against it | Rebuilt |
| Blue-roof building | Different architecture from the Old Building: heavy concrete band, concrete columns, pale blue lower wall, ribbon windows, stairs from S.V. Rizal St, graduation banners. Confirmed part of CCC by the project owner | Rebuilt and labelled as CCC |
| Surroundings | Tricycle queues along S.V. Rizal St, three-storey white and blue health building on east Barreto St, grey milk tea building beside the plaza, cream two-storey building west along Barreto St | Added, simplified |

### Why the floor plans were refitted

The original Old Building plans were first stretched over both the north block and the large blue roof. Fitting them to the north block alone places the plan's **Gazebo and "Open Below" within a few metres of the real tree courtyard**, **Lazaro Hall under the central roof**, and the **Lobby behind the portico**. This suggests the original plans describe the north block only, though the plan's depth is compressed to fit and needs surveying. The blue-roof building is part of CCC, and no room on these plans has been matched to it yet.

### Facts to confirm on site

- **What the blue-roof building is called and what rooms it holds.** It is part of CCC, but its rooms aren't mapped. Check whether the original plans and panoramas include any of it, or whether it needs its own floor plan and photos. Google Maps labels the spot Calamba Manpower Development Center, and the New Building plan shows "Calamba Manpower" at its centre, so check how those names relate.
- The Old Building's rear and side elevations, which were only partly visible
- Floor heights, and what the New Building's north and east sides look like
- Where the Aquarium is on the lower ground floor (placeholder in the sample)
- **Sphere 1's orientation.** The grey building appears on opposite sides in spheres 1 and 2 relative to the view toward the college, so sphere 1 may be mirrored differently. Check this before reusing it as-is

### Data sources

| Source | Use | Note |
|---|---|---|
| Original 52 panoramas and 5 floor plans | Room content and layout | Confirm reuse rights with the original authors or the college |
| Own site survey (tape or laser, phone photos) | **True dimensions** | Needed from Stage B |
| Drone or campus-issued plans | Roof and overall shape | Needs school permission |
| OpenStreetMap | Streets and neighbouring blocks | Open licence, attribution required |
| Google Maps and Street View | **Reference only** | Their terms restrict tracing and derived content. No Street View images are stored in this project. Replace these estimates with survey or OpenStreetMap data before any public release, and check with your adviser about academic use |

## 4. Experience design

### Modes

| Mode | Purpose |
|---|---|
| **Diorama** | Orbit the campus, as in the reference |
| **Cutaway floors** | Remove the roof and see each floor's rooms |
| **360° photo** | Stand in the real place, with the original's camera bugs fixed |
| **On foot** | Walk a student character around the campus |
| **Full 3D room** | Walk inside modelled rooms (Stage B onward) |

### Gamification: "Student Passport"

The game layer should encourage people to learn the campus rather than distract from it.

| Mechanic | How it works | Learning purpose |
|---|---|---|
| **Stamps** | Check in at a location to stamp your passport | Encourages full coverage |
| **XP and levels** | Earned from stamps and quizzes | Gives a sense of progress |
| **Quick quiz** | One question answered from the panel text | Checks that the content was read |
| **Badges** | Such as Old Building Explorer and Campus Guide | Sets clear goals |
| **Orientation quest** (later) | "Enrol": Guard → Registrar → Cashier → Classroom | Teaches real student tasks |
| **Scavenger hunts** (later) | Find the Mission and Vision, or the Gazebo | Encourages exploration |
| **Campus events** (later) | Foundation Day and Christmas themes | Gives reasons to return |

Progress is kept in the browser at first, so there are no accounts. A leaderboard would need a backend and a privacy review, so it is left out unless the thesis needs it.

### Fixes from the original

| Original problem | Remaster approach |
|---|---|
| 3,286 lines of hand-wired navigation | One data file for locations, links, and panels |
| Wiring bugs on Bio Chem, Hall 1, and the aquarium | Single navigation function plus automated route tests |
| Static map | The 3D campus is the map |
| Camera can flip over, speed depends on frame rate | Clamped, frame-rate independent controls |
| Mouse only | Mouse, touch, and keyboard |
| No sound | Optional ambience and interface sounds |

## 5. Architecture

```text
index.html
src/
  data/       locations, rooms, links, quizzes, badges (JSON or JS)
  world/      campus, buildings, floors, props, characters
  systems/    camera views, walking, picking, day/night
  game/       passport, XP, quests, saving
  ui/         panels, cards, labels, accessibility
public/
  panos/      360° photos (KTX2 or WebP in production)
  models/     glTF rooms (Draco + KTX2)
tests/        route and content checks
```

**Key rule:** content lives in data, not code. Adding a room should need a data entry and an optional model, with no new functions.

```js
{
  id: "lazaro",
  name: "Roman Lazaro Hall",
  building: "old", floor: "ob_gf",
  position: [31, 0, 15],
  pano: "panos/lazaro.jpg",
  model: null,           // becomes "models/lazaro.glb" at Stage B
  links: ["lobby", "cashier", "faculty-room"],
  text: "...",
  quiz: { q: "...", options: ["..."], answer: 0 }
}
```

### Performance budget

| Item | Target |
|---|---|
| First load on a mid-range phone | Under 5 s, under 8 MB before optional content |
| Frame rate | 60 fps on a laptop, 30 fps or better on a phone |
| Draw calls | Under 150 by merging and instancing |
| Each 360° photo | Loaded on demand, under 500 KB |
| Each room model | Loaded on demand, under 3 MB |

## 6. Work plan

Durations are estimates for one developer working part-time. Adjust them to your thesis deadline.

| Phase | Work | Output | Estimate |
|---|---|---|---|
| **0. Prototype** | Reference study, campus estimate, sample | `prototype/` | Done |
| **1. Validation** | Adviser review, content permission, site survey | Confirmed layout and rights | 1–2 weeks |
| **2. Foundation** | Move to the architecture above, add all locations and proofread text | All 52 panoramas and panels in data | 2–3 weeks |
| **3. Campus exterior** | Accurate buildings from survey data, trees, streets | Finished Stage A | 3–4 weeks |
| **4. Game layer** | Quests, more badges, sound, mobile controls | Full Passport | 2–3 weeks |
| **5. Key rooms** | Model Lobby, Lazaro Hall, Library, Registrar, Cashier, Computer Lab, Classroom, AVR, Gazebo, Student Center | Stage B | 4–6 weeks |
| **6. Evaluation** | User testing, fixes, thesis data | Results chapter | 2–3 weeks |
| **7. Stretch** | Room kit, then remaining rooms | Stage C or D | As time allows |

**Deployment:** a static host such as Vercel or GitHub Pages works, as there is no backend.

## 7. Thesis evaluation

Compare the original and the remaster with the same participants or matched groups.

| Measure | Tool |
|---|---|
| Usability | System Usability Scale (SUS) |
| Motivation | Intrinsic Motivation Inventory (IMI), or a validated game-experience questionnaire |
| Wayfinding | Time and errors finding given rooms |
| Knowledge retained | Short quiz on campus facts, before and after |
| Performance | Load time and frame rate across test devices |

Participant testing may need ethics approval or consent forms, depending on your school's rules.

## 8. Risks

| Risk | Impact | Response |
|---|---|---|
| Scope grows to all rooms too early | Thesis delay | Treat Stage B as the finish line and the rest as stretch |
| Inaccurate layout from satellite estimates | Credibility | Survey on site, and label estimates until then |
| Limited campus access or permission | Blocks survey and photos | Request permission early through your adviser |
| Rights to original assets or map data | Public release problem | Get written permission and replace Google-derived data |
| Slow on low-end devices | Excludes users | Performance budget, on-demand loading, quality setting |
| Content out of date since 2022 | Wrong information | Have the college review offices, officials, and plans |
| Game elements distract from learning | Weak results | Tie rewards to reading and real tasks, and test it |

## 9. Sample build

The sample in [`prototype/`](prototype/) tests Stage A with real content from the original.

**Run it:**

```bash
cd "C:\kydnagpala\Programming\Projects\remastered ccc virtual tour\prototype"
npm install
npm run dev
```

**It includes:**

- A procedural campus built to the estimated layout, with no external 3D models
- Cutaway views of all 5 floors, with rooms placed from the original floor plans
- 12 locations using the original 360° photos and panel text
- Student Passport with stamps, XP, levels, quizzes, and badges saved in the browser
- On-foot walking mode with building collisions
- Blocky, Minecraft-inspired students in the CCC uniform: white blouse with navy piping and crest, navy pants
- Day, golden hour, and night themes, plus layer toggles

**It leaves out:** true 3D rooms, the other 40 panoramas, sound, and surveyed dimensions. The building styles follow real references, but counts of windows and props, and the rear of the buildings, are still approximate.

## 10. Decisions needed

1. **Your thesis deadline**, so the phases can be fitted to real dates.
2. **Site survey access**, and whether you can get floor plans or drone permission from the college.
3. **Rights** to reuse the original tour's photos and text.
4. **Target devices**, especially whether phones are a must-have for your evaluation.
