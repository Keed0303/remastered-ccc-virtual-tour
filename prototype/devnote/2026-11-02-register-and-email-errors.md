# Register form and sign-up email errors

**Date:** 2026-11-02
**Status:** Code changed. Supabase URL settings changed and email confirmation turned off, both checked 2026-11-02. A real sign-up is still untested.

## 1. Remove "Confirm password"

The project owner asked to remove this field from the register form. `RegisterForm`, `AccountDialog`, and `validateRegistration` no longer use it.

**Risk:** a mistyped password now goes unnoticed, and the site has no "forgot password" feature. An admin can't see passwords either, so that student would need help from an admin or a new account. A "show password" button or a password reset would cover this later.

## 2. Error: confirmation link leads to an unreachable page

**What happens:** after clicking the link in the confirmation email, the browser can't reach the site.

**Cause:** Supabase's Site URL and Redirect URL are still `http://localhost:5173`, as set during development. The code asks to return to the live site with `emailRedirectTo: location.origin`, but Supabase ignores any address that isn't on its allowed list and uses the Site URL. On a visitor's computer, nothing runs at that address.

**Evidence:** on 2026-11-02, a request to Supabase's public verify endpoint with a made-up token and `redirect_to=https://ccc-virtual-tour.vercel.app` was answered with `Location: http://localhost:5173#error=...`. The made-up token used no real link and sent no email.

**The account is still confirmed.** Supabase confirms the email before redirecting, so a student who hit this page can log in on the live site. Their link has been used, so it isn't needed again.

**Fix, in Supabase under Authentication → URL Configuration:**

- **Site URL:** `https://ccc-virtual-tour.vercel.app`
- **Redirect URLs:** add `https://ccc-virtual-tour.vercel.app/**` and keep `http://localhost:5173/**` for development

No code change is needed. The auth devnote listed this as a step to do before deploying, and it wasn't done.

**Applied 2026-11-02.** The same made-up-token request now redirects to `https://ccc-virtual-tour.vercel.app`, `http://localhost:5173` still works, and `https://example.com` is refused and sent to the Site URL. The older exact entry `http://localhost:5173` was left in the list.

## 3. Error: "Too many attempts. Please wait a moment and try again."

**What happens:** registering shows this message after the character step.

**Cause:** `friendlyError` shows it whenever Supabase's error mentions a rate limit. The likely source is the email limit. Authentication → Rate Limits shows **2 emails per hour** for the whole project, and that field can't be edited without a custom email service. Every sign-up that sends a confirmation email counts, so two test sign-ups use it up. The sign-up and sign-in limit is 30 per 5 minutes per IP address, which is much harder to reach. The exact error returned to the failed sign-up wasn't captured.

**Why the message misleads:** "a moment" suggests seconds, but this limit can take much longer to clear.

**Fix in code:** give the email limit its own message, saying to try again later. Other rate limits keep the existing message.

**Fix for real use, a project owner decision:** a class of students registering together will hit this limit. Either connect a custom email service (SMTP) in Supabase, which allows a higher limit, or turn off email confirmation under Authentication → Sign In / Providers. Turning it off means nobody has to verify, but anyone can register with an address they don't own.

**Decided 2026-11-02: email confirmation is off,** at the project owner's request. "Confirm email" is off under Authentication → Sign In / Providers, and the public auth settings now report `mailer_autoconfirm: true`. Sign-ups no longer send a confirmation email, so they no longer use the 2 per hour limit, and a new student is logged in right after registering. `signUp` already handles this, because Supabase returns a session straight away. The confirmation step in `AccountDialog` stays in the code in case this is turned back on.

## Checks

- `validateRegistration` and `friendlyError` have tests
- The browser tests register without the field
- After the Supabase change: register a real account, click the link, and confirm it opens the live site logged in
