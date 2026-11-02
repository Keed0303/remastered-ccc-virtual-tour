# Voice talk — nearby students talk through their mics, with a mic icon above each head

**Date:** 2026-11-02
**Status:** Implemented on `main`, not committed. Not yet tried between two real devices.
**Scope:** scene class and pure rules — `src/scene/VoiceChat.ts`, `src/utils/voice.ts`, plus a button in `WalkHud`

---

## Request

Logged-in students can talk to each other through their microphones. A mic icon shows above a student's head: green when their voice is working, and a muted-mic icon when they are muted.

## Decisions and assumptions

Chosen by the project owner:

- **Nearby only.** Voice fades with distance and stops at 25 m.
- **Mic off until clicked.** Clicking the button or pressing **M** asks for permission, then switches between live and muted.
- **Free, STUN only.** No relay server or new account, so some strict networks won't connect.

Assumed:

- **Voice works on foot only.** Other students' distance is only meaningful between walking figures. Leaving walking or opening a 360° photo turns the mic off and closes voice connections, so the render loop's panorama early return doesn't leave anything running.
- **Listening needs no click.** A walking student hears a nearby student whose mic is on. Their own mic stays off.
- **No new dependency.** Browsers have WebRTC built in, and signaling uses the existing `campus` Realtime channel.
- **At most 6 voice connections each,** nearest first. Each student connects directly to each other student, so the load grows with every connection.
- **Indoors and outdoors can't hear each other,** matching how name bubbles already hide.

## Design

```text
A (lower id)                    campus channel                    B
 ├─ state: mic, speaking, on foot ──────────────────────────────► │  every 3 s and on change
 ├─ offer, with all ICE candidates ─────────────────────────────► │
 │ ◄──────────────────────────── answer, with all ICE candidates ─┤
 └──────────────── voice travels directly, encrypted by WebRTC ───┘
```

- **Only the lower id offers,** so two students can't offer to each other at once.
- **Candidates travel inside the offer and answer,** which keeps channel traffic low.
- **Every connection reserves an audio slot.** Turning the mic on or off swaps the track without renegotiating.
- **Volume** runs through Web Audio, because iOS ignores `audio.volume`. A muted `<audio>` element also holds each stream, because Chrome otherwise plays remote WebRTC audio silently through Web Audio.
- **Connections keep a margin:** they open within 25 m and close beyond 32 m, so someone at the edge doesn't keep reconnecting.
- **The scene stays out of React per frame.** `VoiceChat` sits under `OnlinePlayers`, and only mic state changes reach React.

### Icons

Shown above the name bubble by a `data-voice` attribute, drawn in CSS.

| Icon | Meaning |
|---|---|
| None | Mic off, or not walking |
| Green mic, pulsing while speaking | Mic live, and connected. Your own turns green once the mic opens. |
| Red crossed-out mic | Muted |
| Grey mic | Mic live, but not connected: connecting or out of range |
| Amber mic | Mic live, but the connection failed. This is how strict networks show up. |

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `src/types/voice.ts` | New | Mic states and channel messages |
| `src/utils/voice.ts` | New | Volume, peer choice, icons, and message cleaning, all pure |
| `src/utils/voice.test.ts` | New | Tests for those rules |
| `src/scene/VoiceChat.ts` | New | Mic, connections, and playback |
| `src/scene/OnlinePlayers.ts` | Modified | Runs voice each frame and sets icons |
| `src/scene/CampusScene.ts` | Modified | On-foot state, the M key, and events |
| `src/types/backend.ts`, `src/utils/backend/*` | Modified | `onVoice` and `sendVoice` on the campus connection |
| `src/hooks/useCampusPresence.ts` | Modified | Passes voice messages to the scene |
| `src/components/campus/WalkHud.tsx`, `MicButton.tsx`, `CampusPage.tsx` | New / Modified | The mic button |
| `src/styles/campus.css` | Modified | Icons and button |
| `tests/e2e/voice.spec.ts` | New | Two browsers with a fake mic |

### Data

None. No tables, and the existing Realtime policies on the `campus` topic already cover this event. Voice is never stored or sent through Supabase.

## Privacy and security

- **Direct connections reveal IP addresses.** Each connected student's browser sees the other's. Offers are also broadcast on the `campus` channel, so any logged-in student's browser receives them. A relay server would hide this.
- **Google's public STUN server** sees each voice user's IP address while connecting.
- **Signaling isn't authenticated per message.** A modified client could forge a voice message. Messages are size-checked, must come from someone online, and are only used by `RTCPeerConnection`, so they can't inject page content. This matches the risk already accepted for positions in the multiplayer devnote.
- **The mic opens from a click on Explore on foot** (see the revision below), and the browser asks permission the first time.

## Test plan

| Case | Type | Expectation |
|---|---|---|
| Volume at 0, mid-range, and 25 m+ | unit | Full, fading, silent |
| Inside and outside | unit | Silent |
| Peer choice with too many nearby | unit | Nearest 6 |
| Peer between 25 and 32 m | unit | Kept if connected, not opened if new |
| Icon for each state | unit | Matches the table above |
| Hostile messages | unit | Refused |
| Mic level and speaking | unit | Silence vs signal |
| Two students near each other, one turns the mic on | e2e | Connection opens, audio arrives, icons turn green on both |
| Mute | e2e | Muted icon on both, and no track sound |
| Walk out of range | e2e | Connection closes, and the icon greys |
| Exit walking | e2e | Mic off, and the icon disappears |
| Mic permission denied | e2e | Clear message, and the mic stays off |
| Logged-out visitor | e2e | No mic button |

A real STUN connection between two networks, real headsets, and iOS can't be tested here. They need two real accounts on two real devices.

## Out of scope

A TURN relay, push to talk, muting one other person, volume controls, stereo direction, walls blocking sound, moderation, and voice while not walking.

---

## Revision — 2026-11-02: mic turns on from Explore

The project owner changed the earlier "off until clicked" decision. Clicking **Explore on foot** while logged in now asks for mic permission and turns the mic on.

- **Logged-out visitors** still get no mic.
- **After permission is given once,** the browser doesn't ask again, so the mic goes live on every Explore. The message naming the mic is the only sign, so students should know this before using it.
- **Leaving walking still turns the mic off.** Closing a 360° photo doesn't turn it back on, because only Explore does. The button or M does.
- **Clicking Explore just after logging in** can come before the live campus connection is ready. The request waits and runs once it is.
- **A refused permission** shows the existing message each time Explore is clicked.

---

## Outcome

- **Commands:** `npm run typecheck`, `npx vitest run`, `npx playwright test`, `npx vite build`
- **Result:** type checking clean. Vitest 70 passed, 0 failed, 0 skipped (6 files, 33 of them new). Playwright 18 passed, 0 failed, 0 skipped (4 of them new).
- **Coverage:** not measured. The project has no coverage tool, and adding one wasn't part of this feature. `utils/voice.ts` is unit tested. `scene/VoiceChat.ts` needs a real browser, so the Playwright tests cover it.
- **CLAUDE.md:** updated the layout table, the test notes, and the conventions. `src/scene/CLAUDE.md` is untracked and was left alone, so it doesn't list `VoiceChat.ts` yet.

### Checked

Two Chrome pages with a fake mic, on the demo backend, connected with real WebRTC: audio bytes arrived, the volume faded with distance, the connection closed out of range and reopened on return, and the icons changed on both screens. The failed icon was tested by forcing connections to fail. Screenshots confirmed how the green and muted icons look.

### Problems found while building

- **Amber icon flicker:** clearing a failure when a retry began would have switched the icon between amber and grey. A failure now clears only once connected.
- **Parallel browser tests failed under load:** five tests failed when run in parallel, including older ones, and the same older tests passed one at a time. Playwright now uses one worker, and the full run takes about 4 minutes.

### Not checked

- **The live Supabase channel.** The `voice` event hasn't run on it. The Realtime policies allow any event on the `campus` topic, so no change should be needed.
- **Two real devices on different networks,** including whether school or mobile networks connect with STUN only
- **Real microphones and headsets,** including echo and how well the speaking threshold suits real voices
- **Hearing the audio.** Tests confirm audio bytes and volume, not that a person hears it through the speakers.
- **iOS Safari and real phones**
- **More than two students at once.** The limit of 6 connections has a unit test only.

### Outstanding

- **Privacy:** connected students' browsers can see each other's IP addresses, voice offers reach every logged-in browser, and Google's STUN server sees each voice user's address. The site's legal text doesn't mention voice yet.
- **Listeners can't silence someone.** There is no per-person mute or moderation.
- **The mic stays open while muted.** The browser's recording indicator stays on, and the mic is released only when walking stops.
