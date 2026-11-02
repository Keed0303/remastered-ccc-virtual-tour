# Error: "Accounts are not set up on this site yet."

**Date:** 2026-11-02
**Status:** Message corrected in code. The project owner reports the hosted site's accounts working as of 2026-11-02.

## What happens

Clicking **Log in / Register** on the hosted site shows this toast, and the account dialog doesn't open.

## Cause

`utils/backend/index.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when the site is built. If either is missing in a production build, `backendMode` is `'none'` and the site has no accounts.

Those values live in `.env.local`, which stays out of git. Vercel builds from GitHub, so it only has them if they are set in the Vercel project.

Reproduced on `main` at a001c17 by building with both values empty. The bundle has no Supabase project address, and clicking the button shows the same toast.

Not confirmed: the Vercel project's settings and its live bundle. The dashboard needs a sign-in, and the address on the GitHub repo (`prototype-one-lilac.vercel.app`) returns `DEPLOYMENT_NOT_FOUND`.

## A second problem in the code

`openAccount` in `CampusPage.tsx` showed this message whenever `backend` was null, which is also true in two other cases:

- **Still loading:** the Supabase library loads on demand, so a quick click on a slow connection got this message on a correctly set up site.
- **Failed to load:** a network failure got it too, and telling the visitor to reload is more useful.

## Fix

**In code:** choose the message from the `status` that `useAuth` already reports, so each case says what is true.

| `status` | Message |
|---|---|
| `loading` | Accounts are still loading. Please try again in a moment. |
| `error` | Accounts could not load. Please check your connection and reload. |
| `unavailable` | Accounts are not set up on this site yet. |

**In Vercel, by the project owner:** add these to the project's environment variables, then redeploy. A redeploy is required because Vite copies the values in at build time.

- `VITE_SUPABASE_URL`: the value in `.env.example`
- `VITE_SUPABASE_ANON_KEY`: the publishable key from `.env.local`, never `service_role`

The keys stay out of git, as the project's rules require.

## Check after redeploying

Log in / Register opens the account dialog on the hosted site.

## Results

Checked on production builds of the fix, with requests to Supabase blocked:

| Case | Result |
|---|---|
| Built without keys | "Accounts are not set up on this site yet." |
| Built with keys, library still loading | "Accounts are still loading. Please try again in a moment." |
| Built with keys, library failed to load | "Accounts could not load. Please check your connection and reload." |
| Built with keys, library loaded | The account dialog opens |

`npm run typecheck` has no errors, `npm test` passed 33 of 33, and `npm run test:e2e` passed 13 of 13.

`prototype/.env` holds the same two names and wasn't ignored by git, so it is now in `.gitignore`.
