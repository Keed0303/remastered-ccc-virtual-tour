# Multiplayer presence — see other logged-in students with name bubbles

**Date:** 2026-11-02
**Status:** Implemented; tested on the demo backend
**Scope:** `src/online.js`, `src/backend.js`, `src/main.js`

---

## Request

Every logged-in user can see the other logged-in users on campus. Each logged-in character has a name above it, styled like a speech bubble. The Student Passport number goes up when a user joins.

## Decisions and assumptions

- **Supabase Realtime**, with no extra server. Presence tracks who is online and their look, and Broadcast sends positions.
- **Logged-in users only**, through a private channel protected by RLS on `realtime.messages`.
- **Logged-in users who aren't walking** stand at their last position, or by the plaza gate if they haven't walked yet.
- **Positions are sent 10 times a second at most**, and only when something changed. Other players are smoothly interpolated between updates.
- **Limit of 20 visible players**, nearest first, to protect the draw-call budget of 150 (each figure costs 5 calls).
- **Name bubbles are DOM elements** set with `textContent`, so a name can't inject HTML. They hide beyond 70 m, and when one person is indoors and the other outdoors.
- **Your own name** shows above your character too.

## Design

```text
Client A ──track(profile)───► Presence ──sync────► Client B: add or remove figure
Client A ──broadcast(pos)───► campus   ──move────► Client B: update target, interpolate
```

Incoming data is untrusted: names are trimmed to 24 characters, colors checked, and numbers checked and clamped to the campus area.

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `src/online.js` | New | Remote figures, interpolation, name bubbles, online list |
| `src/backend.js` | Modified | `joinCampus` for Supabase and the demo |
| `src/main.js` | Modified | Sends position; updates remote players each frame |
| `index.html`, `src/style.css` | Modified | Online count, bubble style |

### Data

No new tables. The migration adds RLS policies on `realtime.messages` for the `campus` topic, allowing `authenticated` users to read and write.

## Test plan

Two browser tabs on the demo backend, which uses `BroadcastChannel`. Two real accounts must be tried on Supabase by the project owner.

| Case | Expectation |
|---|---|
| Second user logs in | Appears in the first user's scene and online count |
| Second user walks | Moves smoothly for the first user |
| Second user logs out or closes the tab | Figure and bubble are removed |
| Female and male users | Each is seen with the right model and colors |
| Hostile name or color payload | Shown as text; color replaced by the default |
| Logged-out visitor | Sees no other users |

## Known limits

Broadcast payloads come from clients, so a modified client could send a false position for itself. This is acceptable for a campus tour prototype. A public launch would need server-side checks and rate limits.

## Out of scope

Chat, emotes, avatar collisions, and interest management beyond the nearest-20 limit.

---

## Outcome

There is no Jest suite in this project (see `CLAUDE.md`), so checks ran in the browser through `window.__ccc`.

- Two tabs each saw the other, the count showed 2 online, and each had the right name bubble and gender.
- Logging out removed the other figure, and the count returned to 1 online.
- A hostile name stayed plain text with no injected element. Bad colors and gender used defaults, and bad coordinates were clamped or ignored.
- A test client's position reached the other tab. Smooth movement and the nearest-20 limit were not separately measured.
- **Not tested:** Supabase Realtime and its RLS policies. The demo uses `BroadcastChannel`.
- **Outstanding:** test with two real accounts on two devices.
