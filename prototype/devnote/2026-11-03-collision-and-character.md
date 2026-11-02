# Environment collision and character restyle

**Date:** 2026-11-03
**Status:** Implemented. Not committed.

## Requests

1. Stop players walking through plants and fences.
2. Restyle the character to match the project owner's voxel reference image.
3. Female characters wear a school skirt instead of trousers.

## Collision plan

`COLLIDERS` in `utils/physics.ts` is the single list for walking and the follow camera, so everything goes there.

| Thing | Collider |
|---|---|
| Trees | A box around each trunk. Tree positions move to a `TREES` list in `physics.ts` that `ground.ts` draws from, so they can't drift apart |
| Plaza fences and the west planter wall | Long strips down both sides. The Barreto St entry and the north end stay open |
| Plaza entry planters | Their full footprint |
| Market stalls, the green cart, and the building at the end of Barreto St | Their footprints |

Old Building planters and palms already have colliders. Colliders for low things get a `top`, so the camera can still pass above them.

**Not covered:** tables, benches, lamp posts, and pergola posts, because this request was about plants and fences. Walking students don't use collisions at all, so their paths move away from the new planters, but they can still brush a street tree.

## Character plan

The reference is a chunky voxel figure:

| Part | Change |
|---|---|
| Head | Larger, with a separate nose block, ears, white eyes with dark pupils, thick eyebrows, and a mouth |
| Hair | Stepped blocks with bangs. Long hair falls down the back and sides |
| Body | Shorter torso, slimmer arms and legs, blocky hands and shoes |
| Uniform | Keeps CCC's white top, navy piping, and crest |
| Female | Navy pleated skirt, bare legs, white socks, and dark shoes |
| Male | Navy trousers and dark shoes |

The figure keeps its height and hip height, so sitting, name bubbles, the camera, and the character preview don't need changes. Walking students get the new style too, including skirts on the female ones. The skirt follows the existing `gender` choice, so no new saved data is needed.

The reference only sets the style. No artwork or characters from it are copied.

## Outcome

- **Collision:** trees, plaza fences, entry planters, market stalls, the green cart, and the building at the end of Barreto St now stop a walker. The plaza's entry and north end stay open.
- **Character:** the new style applies to the player, other students, walking students, and the customizer preview. Female figures wear a navy pleated skirt with white socks.
- **Results:** type checking is clean. Vitest passed 104 of 104. Playwright passed 29 of 29 in the regression, seats, smoke, collision, and `voice.spec.ts` files, in about 6 minutes. `voice-two-way.spec.ts` wasn't run in that set. It passed 6 of 6 later.
- **Test failures:** see the revision below.
- **Not checked:** the customizer screen by eye, the sitting pose with the skirt, and real phones.

## Revision — 2026-11-03: investigating the test failures

**Two-way voice test:** it passed 6 of 6.

**`voice.spec.ts`, message check.** My first explanation was wrong. I said another message arrived first, but I hadn't checked it. Logging showed the mic message was the only message. It lasts 3.2 seconds, and the test only looked for it after setting up the second student, so in 2 of 3 measured runs it had already gone. My first fix couldn't have solved that. The test now checks the message before setting up the second student.

**`voice.spec.ts`, mic check, and `seats.spec.ts`, seat hint.** Both failed by running out of the default 5-second wait. With two students open on software WebGL, the pages ran at about 1–2 frames per second, and the hint took 2.2–3.3 seconds to appear right after walking started. The camera had already moved, and the hint appeared in the expected place. The seat failure wasn't reproduced directly, so this cause is well supported but not proven. The wait is now 15 seconds in `playwright.config.ts`. It only makes a real failure slower to report, and doesn't slow a passing test.

**Other load:** my preview tab was still drawing the campus during the earlier runs, which may have added load. It's now closed.

**Frame rate:** 1–2 frames per second was measured with software drawing during tests, and isn't what a player with a real graphics chip would see. Real-device frame rate hasn't been measured.
