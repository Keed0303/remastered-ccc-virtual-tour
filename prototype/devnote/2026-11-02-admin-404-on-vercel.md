# Error: `/admin` returns 404 on Vercel

**Date:** 2026-11-02
**Status:** Fix written. Not confirmed until it is deployed.

## What happens

Opening `https://ccc-virtual-tour.vercel.app/admin` directly shows Vercel's "This page doesn't exist" page with `404 NOT_FOUND`. The **Admin** link in the account menu goes to the same address, because it is a full page load.

## Cause

`/admin` exists only as a React route, not as a file. The server has to send `index.html` first so React can load and show the page. Vercel looks for a file at `/admin`, finds none, and returns 404. Nothing in the repo tells it to do otherwise.

The plain JavaScript version had a real `admin.html`, so moving to routes created this. The migration devnote and `CLAUDE.md` both said hosting must serve `index.html` for `/admin`, but no hosting rule was added. `npm run dev` and `npm run preview` already do this, so local checks and the browser tests couldn't catch it.

## Evidence

Checked against the live site on 2026-11-02:

| Address | Result |
|---|---|
| `/` | 200 |
| `/index.html` | 200 |
| `/admin` | 404, with `X-Vercel-Error: NOT_FOUND` |
| `/assets/AdminPage-Bqc1oH6w.js` | 200, so the admin code is deployed |

The admin page's code and its access check aren't involved, because the request never reaches them.

## Fix

Add `prototype/vercel.json` to serve `index.html` for `/admin` and for the old `/admin.html` address. React then handles both.

It lists those two addresses instead of matching everything, so a missing panorama or script still returns a real 404 rather than a page of HTML. A new route needs a new line here.

The file goes in `prototype/` because that is the Vercel project's root: the repo root has no `package.json`.

This doesn't change who can use the page. The admin page still checks the role, and Supabase still enforces it on the data and the Edge Function.

## Check after deploying

- `/admin` and `/admin.html` return the app and show the admin login
- `/` still loads the campus
- A made-up address such as `/nonexistent` still returns 404
