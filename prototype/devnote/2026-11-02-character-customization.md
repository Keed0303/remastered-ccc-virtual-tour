# Character customization — gendered models, skin color, and hair color

**Date:** 2026-11-02
**Status:** Implemented; tested on the demo backend
**Scope:** `src/world.js`, `src/account.js`, `src/data.js`

---

## Request

The gender chosen at registration decides the character: a female user gets a female character. After clicking Register, a dedicated screen lets the user change skin color and hair color.

## Decisions and assumptions

- **Female model:** long hair, slightly slimmer build, eyelashes, and a soft lip color. **Male model:** short hair and the current build.
- **Both wear the same uniform** from the reference photo with navy pants, as requested. A skirt or other variation can be added once there's a reference.
- **Colors:** preset swatches plus a free color picker for more choice.
- **Preview:** a live, slowly turning 3D figure in its own small renderer, created when the screen opens and disposed when it closes, so it costs nothing during play.
- **Editable later:** a Customize button in the account menu reopens this screen. Gender stays changeable there too.

## Design

```text
+-------------------------------+
| Customize your character      |
|      [ rotating 3D preview ]  |
| Skin  ● ● ● ● ● ● (custom)    |
| Hair  ● ● ● ● ● ● (custom)    |
| [Back]        [Finish]        |
+-------------------------------+
```

- `figureBody` gains a `gender` option. The arm and leg builders stay shared, and the character group positions them by gender.
- `createPlayerFigure(look)` builds a full figure. The player's own avatar and other users' avatars both use it.
- `SKIN_SWATCHES` and `HAIR_SWATCHES` live in `data.js`, following the project's "content lives in data" rule.
- All colors pass through `isHexColor` before reaching geometry.

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `src/world.js` | Modified | Gendered figure, `createPlayerFigure` |
| `src/data.js` | Modified | Swatches and default look |
| `src/account.js` | New | Customization screen and preview |

### Data

Uses `gender`, `skin_color`, and `hair_color` on `profiles`. See the authentication note.

## Test plan

| Case | Expectation |
|---|---|
| Choose Female | Preview and avatar have the female model |
| Choose Male | Preview and avatar have the male model |
| Pick swatch or custom color | Preview changes immediately and is saved |
| Close the screen | Preview renderer is disposed |
| Invalid color from another client | Falls back to the default look |

## Out of scope

Hairstyles, outfits, accessories, and face options.

---

## Outcome

There is no Jest suite in this project (see `CLAUDE.md`), so checks ran in the browser through `window.__ccc`.

- Female registration produced `gender: female` on the profile and avatar. Male registration produced `gender: male`.
- Selected swatches changed the preview and were saved (hair `#7d3a1e`, skin `#c98d63`).
- Invalid colors and gender from another client fell back to defaults.
- **Not tested:** the Custom color inputs and saving edits from the account menu were built but not clicked through.
- **Outstanding:** none known.
