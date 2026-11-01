# User authentication — accounts with Supabase Auth

**Date:** 2026-11-02
**Status:** Implemented; migration applied, real sign-up not yet tried
**Scope:** schema, `src/backend.js`, `src/account.js`, `index.html`

Supabase project: `finlclaxrosedfwuyowi` ([dashboard](https://supabase.com/dashboard/project/finlclaxrosedfwuyowi))

---

## Request

Let students register and log in. Registration collects their details and gender. After they click Register, a character customization screen follows. Logging in also counts toward the number of Student Passports.

## Decisions and assumptions

- **Email and password** through Supabase Auth. Passwords never touch our tables or browser storage.
- **The account is created at the end of customization.** Everything is sent together in the sign-up metadata, and a database trigger creates the profile. This still works if the project requires email confirmation, because no client write is needed before there is a session.
- **Gender is Female or Male**, as requested, because it selects the character model.
- **Student Passport count (my interpretation):** one passport per registered account, shown as "Passports issued". Logging in again does not add another, so the number can't be inflated by repeat logins. To change this, see *Alternatives*.
- **Passport progress stays in the browser** for now. Stamps and XP are not synced to accounts.
- **Only the public anon key goes in the client.** The `service_role` key must never be used in this app.
- **Demo backend:** when no keys are configured in `npm run dev`, a local stand-in using browser storage allows offline development and automated tests. It stores no passwords, is labelled in the UI, and isn't available in production builds.

## Design

```text
Log in / Register
  ├─ Log in ──────────────► session ─► load profile ─► join campus
  └─ Register (details + gender)
       └─► Customize character (skin, hair, live preview)
             └─► signUp(metadata)
                   ├─ session returned ─► join campus
                   └─ no session ─► "Check your email to confirm"
```

`src/backend.js` exposes one interface with two implementations, Supabase and demo:

`getSession`, `signUp`, `signIn`, `signOut`, `updateProfile`, `passportCount`, `joinCampus`.

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `supabase/migrations/20261102000000_profiles_and_presence.sql` | New | Tables, trigger, RLS, count function |
| `.env.example` | New | Names of the two required settings |
| `.gitignore` | Modified | Keep `.env.local` out of git |
| `src/backend.js` | New | Supabase and demo backends |
| `src/account.js` | New | Login, register, and customization UI |
| `index.html`, `src/style.css`, `src/main.js` | Modified | Dialog, account button, wiring |
| `package.json` | Modified | Adds `@supabase/supabase-js`, loaded on demand |

### Data

`public.profiles`:

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | References `auth.users`, deleted with the account |
| `display_name` | text | 2–24 characters |
| `gender` | text | `female` or `male` |
| `skin_color`, `hair_color` | text | `#rrggbb` |
| `created_at` | timestamptz | Default now |

- **RLS:** logged-in users can read all profiles. Users can update only their own, and nobody can insert or delete directly, since the trigger inserts.
- **Trigger:** `handle_new_user` creates the row, cleaning up and clamping the metadata so bad values can't block sign-up.
- **`passport_count()`:** a security-definer function that returns only a number, so logged-out visitors can see the count without reading profiles.

## Setup

1. Run the migration in the Supabase SQL editor, or with `supabase db push`.
2. Copy `.env.example` to `.env.local` and fill in the project URL and anon (publishable) key.
3. In Authentication → URL Configuration, add the site's URL. Decide whether to require email confirmation.

## Test plan

Automated tests use the demo backend. Real Supabase sign-up must be tried by the project owner, because automated account creation against a live service isn't something I do.

| Case | Expectation |
|---|---|
| Register with valid details | Moves to customization, then logs in |
| Short name, invalid email, short password, no gender | Clear message; stays on the form |
| Duplicate email | Returns to details with a message; customization kept |
| Log out and log back in | Profile and look restored |
| Reload while logged in | Session restored |
| Hostile name (`<img onerror>`) | Shown as plain text |

## Alternatives

Counting every login instead of every account needs a `login_count` column and an update at login. It's a small change if that was the intent.

## Out of scope

Password reset, social login, syncing passport progress, and account deletion UI.

---

## Outcome

There is no Jest suite in this project (see `CLAUDE.md`), so checks ran in the browser through `window.__ccc`.

- All five validation messages appeared correctly, and registering moved to customization.
- Registering logged the user in with the right profile, and the passport count rose from 0 to 2 across two users.
- The session was restored after a reload. Logging out returned the button to its logged-out state.
- Implementation change: the demo backend keeps the session per tab, so two tabs can act as two users.
- **Applied 2026-11-02:** the migration ran on the empty `ccc` project through the SQL editor. Verified: `profiles` with RLS on, the trigger, both functions, and all four policies.
- **Verified live:** the app connects, `passport_count` returns 0, and a wrong login shows the right message.
- **Not tested:** a real sign-up, email confirmation, and Realtime between two real accounts.
- **URL settings:** Site URL and the single Redirect URL are both `http://localhost:5173`, verified after a page reload.
- **Outstanding:** add the real site address to these settings before deploying, and try two real accounts.
