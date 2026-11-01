# Mobile responsive — phone layout, on-screen character controls, and a Passport button

**Date:** 2026-11-02
**Status:** Implemented; tested on the demo backend
**Scope:** `index.html`, `src/style.css`, `src/main.js`

---

## Request

Make the site work properly on phones. On a phone, add on-screen controls for the character. The Student Passport becomes a button that opens the panel when tapped.

## Decisions and assumptions

- "Mobile" means screens 760 px wide or less, or touch screens up to 500 px tall (phones in landscape).
- A thumb joystick replaces the four arrow buttons, because it allows diagonal movement and walking or running by how far it is pushed.
- Dragging anywhere on the scene turns the camera. The joystick and the camera drag must work at the same time, so each tracks its own finger.
- Desktop behaviour doesn't change.

## Design

```text
+--------------------------------+
| [Exit]            [Passport 3/12]
|                                |
|            3D scene            |
|                                |
|   (Stick)           [Check in] |
|                     [Jump]     |
+--------------------------------+
```

- **Passport:** a floating button shows the stamp count. It opens the panel as a sheet with a close button.
- **Joystick:** adds an analog `stick` input to `updateWalk`. Pushing past 85% runs.
- **Jump and Check in:** use the same code as Space and E, moved into shared functions.
- **Look:** `look.drag` remembers the pointer id, so the joystick finger can't turn the camera.

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `index.html` | Modified | Passport button, joystick, action buttons |
| `src/style.css` | Modified | Phone layout, safe areas, sheet |
| `src/main.js` | Modified | Joystick input, sheet toggle, per-finger look |

### Data

None. Local state only.

## Test plan

There is no test suite, so these run through the browser harness (`window.__ccc`) at 375×812 and in landscape.

| Case | Expectation |
|---|---|
| Passport closed on load | Panel hidden, button visible |
| Tap button, then close | Panel opens and closes |
| Joystick pushed up | Character moves in the look direction |
| Joystick and camera drag together | Each responds only to its own finger |
| Jump and Check in buttons | Jump lifts the character; check-in stamps when nearby |
| Desktop width | Button and joystick hidden; panel as before |

## Out of scope

Pinch zoom on foot, and performance tuning for low-end phones.

---

## Outcome

There is no Jest suite in this project (see `CLAUDE.md`), so checks ran in the browser through `window.__ccc`.

- Passport hidden at load, opened and closed by its button.
- Joystick: full push moved 10.89 m in 30 steps of 0.033 s (running), and a partial push moved 2.13 m. The dead zone and release both returned zero.
- Separate fingers: joystick moves did not turn the camera, and a different finger's move was ignored. The camera finger turned the view by 0.16 rad.
- Jump peaked at 0.89 m. The Check in button stamped Flagpole Plaza and the Passport button changed to 1/12.
- Layouts viewed at 375×812, 740×360, and 1280×800. On desktop the Passport panel is unchanged, and the button and joystick are hidden.
- **Outstanding:** the touch events were simulated. It still needs trying on a real phone.
