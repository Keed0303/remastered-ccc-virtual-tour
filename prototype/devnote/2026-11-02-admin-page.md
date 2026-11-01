# Admin page — role-based user management, dashboard, and site settings

**Date:** 2026-11-02
**Status:** Deployed to Supabase; first admin set; not yet tested while logged in as admin
**Scope:** schema, Edge Function, `admin.html`, `src/admin.js`, `src/backend.js`, `src/main.js`

---

## Request

Add an admin page that only users with the admin role can use. The admin can create, edit, and delete user accounts in Supabase, see how many students use the site or have accounts, and control the site from a settings page: hide wireframe, students, vehicles, and labels, and change the number of NPCs.

## Decisions and assumptions

- **Enforcement is on the server.** Hiding the page from non-admins is only a convenience. The database and the function refuse non-admins even if they call them directly.
- **Account changes use an Edge Function.** Creating and deleting login accounts needs the `service_role` key, which must never reach a browser. The function holds it through Supabase's built-in environment and checks that the caller is an admin on every request.
- **Roles are `student` and `admin`.** New accounts are always `student`. Sign-up metadata can't set a role, because the trigger ignores it.
- **Users can't change their own role.** Today's policy lets users update their whole profile row, so column grants will limit them to name, gender, and colors.
- **Protection against lockout:** an admin can't delete or demote their own account, so at least one admin always remains.
- **First admin:** set once with SQL. The email isn't stored in the repository.
- **"Students using the page":** the dashboard shows total accounts and logged-in students online now. Logged-out visitors aren't counted, because that would need analytics, which is out of scope.
- **Hiding a layer:** turning off a setting hides the layer and its toggle button for every visitor. Turning it back on restores the button and the layer's default.
- **Wireframe** defaults to off, so this setting controls whether the Wireframe button is offered at all.
- **"Students" means NPCs.** Real logged-in players stay visible, because seeing each other is a separate feature.
- **Labels** covers campus labels, not players' name bubbles.
- **NPC count:** 0 to 200, chosen to protect phone performance. Default 46, the current number.

## Design

```text
Admin page (browser) ─┬─ read/update app_settings ──► Postgres (RLS: admins write, anyone reads)
                      └─ functions.invoke ──► admin-users Edge Function
                                                1. Verify the caller's token
                                                2. Check role = admin in profiles
                                                3. Use service_role for auth.admin.*
```

- `admin.html` is a separate page, so the campus doesn't load for it. Tabs: Dashboard, Users, Settings.
- Campus pages read settings on load and subscribe to changes, so changes apply live.
- The instanced NPC meshes are created at the maximum size, and only the active count is drawn, so changing the count doesn't rebuild anything.
- `?demo` in `npm run dev` forces the local demo backend, so tests don't touch the real project.

### Files

| File | New / Modified | Purpose |
|---|---|---|
| `supabase/migrations/20261102010000_admin_roles_and_settings.sql` | New | Role column, column grants, `is_admin`, `app_settings` |
| `supabase/functions/admin-users/index.ts` | New | List, create, update, delete users |
| `admin.html`, `src/admin.js`, `src/admin.css` | New | The admin page |
| `vite.config.js` | New | Builds both pages |
| `src/backend.js` | Modified | Settings and admin methods; `?demo` |
| `src/data.js` | Modified | Default settings and `cleanSettings` |
| `src/main.js`, `src/account.js`, `index.html` | Modified | Applies settings, variable NPC count, link to the admin page |

### Data

- `profiles.role`: `student` or `admin`, default `student`.
- `app_settings`: one row with `show_wireframe`, `show_students`, `show_vehicles`, `show_labels`, `npc_count`, and `updated_at`. Anyone can read it, and only admins can update it.
- `public.is_admin()`: a security-definer check used by RLS.

## Test plan

There is no test suite (see `CLAUDE.md`), so checks run in the browser on the demo backend. The real policies are checked after the migration is applied.

| Case | Expectation |
|---|---|
| Logged out, or student, opens the admin page | "No permission", no data shown |
| Admin opens it | Dashboard with correct totals |
| Create, edit, delete user | List and totals update |
| Admin deletes or demotes self | Refused with a message |
| Bad email, short password, invalid colors | Refused with a message |
| Hostile name | Shown as plain text |
| Hide each layer | Layer and button disappear on the campus without reload |
| NPC count 0, 10, 200, and out of range | Correct number drawn; values clamped |
| Student updates own `role` directly (live) | Refused by the database |
| Student calls the function directly (live) | 403 |

## Out of scope

Visitor analytics, audit logs, more roles, bulk actions, and password reset emails.

---

## Outcome

There is no Jest suite in this project (see `CLAUDE.md`), so checks ran in the browser with `?demo`.

- **Access:** logged-out visitors get the login form. A student gets "No permission", and all five admin actions were refused with "Admin permission is required." in the demo backend.
- **Users:** create, edit, delete, and search worked. A duplicate email and short password were refused, the browser's email validation stopped a bad address, and a hostile name stayed plain text.
- **Lockout guards:** deleting or demoting your own account was refused.
- **Settings:** turning all four off hid each layer and all four buttons on another open tab, without a reload. Turning them on restored the layers, with wireframe still off by default.
- **NPCs:** 0, 10, and 200 applied. Values of 999, -5, and `abc` became 200, 0, and the default 46. 200 NPCs used 108 draw calls. Frame rate wasn't measured, because the test pane was hidden.
- **Deployed 2026-11-02:** the migration and the `admin-users` function are on the `ccc` project.
- **Verified live, logged out:** the function returned 401 with no login, the public key as a token, and a fake token. Anyone can read settings. A logged-out update changed 0 rows (`npc_count` stayed 46), and a logged-out delete returned 401. The `role` column has no update permission for `authenticated`, while `display_name` does. `app_settings` has RLS on and is in the Realtime publication.
- **Not tested:** anything as a logged-in admin or student: listing, creating, editing, and deleting users, saving settings, and live updates.
- **First admin:** set on 2026-11-02 at the project owner's request. The project has one account, and its role is `admin`.
- **Open: function's "Verify JWT with legacy secret" setting is ON.** Supabase recommends OFF when a function does its own auth, and this one does. An attempt to turn it off from the browser was blocked by the agent's permission system as weakening security, so it was left on. If the admin page reports `Invalid JWT` or fails to list users, the project owner should turn it off in Edge Functions → admin-users → Settings. The function's own checks still apply.
- **Known limit:** the NPC paths are few, so high counts look crowded along them.

## Bug found during testing

**Symptom:** after an admin logged out and a student logged in on the same page, the hidden table still held 3 user rows.

**Cause:** `logOut` hid the app but left the rendered user list, stats, and online list in the page. The student couldn't see them, but browser tools could read them.

**Fix:** logging out now clears all of them. The server already refuses the data itself, so this only affected data already loaded in that browser tab.
