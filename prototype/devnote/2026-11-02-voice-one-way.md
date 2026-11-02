# Error: other students can't hear me, but I can hear them

**Date:** 2026-11-02
**Status:** Cause not confirmed. Two gaps fixed so the next attempt identifies it.

## What happens

The project owner can hear another student, but that student can't hear them.

## What was ruled out

- **The direct connection.** Hearing one side proves the two browsers connected, so the network and Supabase signaling aren't the problem.
- **The audio path on desktop Chrome.** A new test measures sound at each listener's output, with each role turning the mic on first and with both together. Sound reached both listeners every time, and both sides reported `sendrecv`. These runs used two Chrome pages and a fake mic on the demo backend.
- **Windows muting or a virtual default mic on the project owner's PC.** The default recording device is `Microphone (KT USB Audio)`, which is a real device, not muted, at 77%. Windows settings can't show a hardware mute switch, or which mic Chrome has chosen for this site.

## What is left

The fault has to be at one end: the speaker's real mic, or the listener's playback.

| Possible cause | How it would look | How to tell |
|---|---|---|
| The browser opened a different or silent mic | Green icon, but no pulse when talking | The new message names the mic, and warns about silence |
| Hardware mute on the mic or headset | Green icon, but no pulse | The same warning |
| The listener's browser blocked sound | Their own icon pulses, and they hear nobody | The new "tap to turn on sound" message |
| iPhone or Safari plays this audio differently | Other student on an iPhone hears nobody | Try that student on another device. Not tested, and no iOS device is available here. |

## Gaps in the design

1. **Green only meant "the mic opened".** Nothing told a student their mic was sending silence, or which mic the browser had chosen. This PC has five active inputs, three of them Elgato virtual mixes, so the browser's choice matters.
2. **Sound could stay blocked with no explanation.** Browsers start audio only after a user action. On touch screens `pointerdown` doesn't count, so the unlock could miss. A listener whose sound was blocked saw nothing wrong.
3. **The earlier test measured too little.** It checked data arriving and the volume setting, in one direction, and never checked sound at the output.

## Fix

- **Name the mic** in the message when it opens, using the browser's label for it.
- **Warn about silence:** if no sound has been detected 12 seconds after opening, say so, name the mic, and say what to check. It can't tell silence from someone not talking, so the message starts "If you're talking". It shows once each time the mic opens.
- **Unlock sound on more actions:** `pointerup`, `touchend`, and `click` are added.
- **Say when sound is blocked:** if voice is connected but the browser's audio isn't running after 3 seconds, ask for a tap, and try again when it does.
- **Keep the two-way test** in `tests/e2e/voice-two-way.spec.ts`.

No change to the connection code, because no fault was found there.

## Results

Type checking is clean. Vitest passed 87 of 87. Playwright passed 13 of 13 in the voice and smoke files, including 6 new tests. `regression.spec.ts` and `seats.spec.ts` weren't rerun, because this change only touches voice and its messages.

## Next step

Try again with the fix deployed, and note: whether your own icon pulses when you talk, which mic the message names, and what device and browser the other student is using.
