# Bug — dev server failed to resolve @supabase/supabase-js

**Date:** 2026-11-02
**Status:** Fixed
**Scope:** Local development server. Production builds were not affected.

## Symptom

During testing, a click on a color swatch failed because the swatch list was empty. The browser console showed repeated 500 errors, and the page kept reconnecting to Vite.

## Investigation

| Check | Finding |
|---|---|
| Network log | `GET /src/backend.js` returned 500 on every load |
| Vite log | `Failed to resolve import "@supabase/supabase-js" from "src/backend.js"` at 6:35:35 AM |
| `window.__ccc` | Missing, so `main.js` never finished loading |
| `node_modules/@supabase/supabase-js` | Present, version 2.118.0 |
| `npx vite build` | Passed |

## Root cause

`src/backend.js` was written while the dev server was running, a moment before `npm install` finished. Vite tried to resolve the package while it didn't exist yet, and the running server kept that result.

The swatch failure was only a side effect. `index.html` still showed the static markup, but no JavaScript had run to fill it in.

## Fix

Restart the dev server. No code change is needed.

## Prevention

Install new packages before writing code that imports them, or restart `npm run dev` after adding one.
