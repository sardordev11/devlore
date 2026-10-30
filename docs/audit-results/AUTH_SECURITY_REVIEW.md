# Auth Security Review

**Last audit:** 2026-10-30
**Scope:** `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/types/next-auth.d.ts`, `src/actions/auth.ts`, `src/actions/profile.ts`, `src/lib/{tokens,verification,password-reset,email}.ts`, `src/lib/validations/auth.ts`, `src/lib/db/profile.ts`, `src/app/api/auth/**`, `src/app/(auth)/**`, `src/app/profile/**`, `SignInForm`, `AppSidebar`, `prisma` User/Account/VerificationToken models, `scripts/delete-users.ts`, `.env.example`
**Summary:** 4 findings: 0 Critical, 0 High, 3 Medium, 1 Low

## Findings

### [MEDIUM] No rate limiting on credentials sign-in (or on change-password's current-password check)

- **Location:** `src/auth.ts:26-50`, `src/actions/auth.ts:41-79`, `src/actions/profile.ts:40-50`
- **Issue:** Nothing in the app limits failed password attempts per account or per IP. A grep for rate limiting, `x-forwarded-for` and `headers()` in `src/` found no limiter. `src/proxy.ts` only matches `/dashboard` and `/profile`, and no lockout or counter exists in the schema. `signInWithCredentials` is a public Server Action, and `/api/auth/callback/credentials` is also reachable directly.
- **Attack scenario:** An attacker knows a victim's email (for example from the 409 on sign-up) and sends parallel `POST`s to the sign-in action or the NextAuth credentials callback with a list of common passwords. Each attempt costs one bcrypt cost-12 compare, which slows the attacker but does not stop them. Passwords only need 8 characters, so weak passwords will eventually fall. A hosting-level limiter (for example the Vercel WAF) could mitigate this, but none is configured in the repo. The same applies to `changePassword`, but it needs a valid session first, so it is lower value.
- **Fix:** Add a small DB- or Redis-backed limiter keyed on email plus IP. Check it before `bcrypt.compare` in `authorize`, and return `null` when it trips so the response stays generic. Sketch (needs a new `LoginAttempt` model or Upstash):
  ```ts
  if (await isRateLimited(`login:${parsed.data.email}`)) return null;
  ```
  Alternatively use `@upstash/ratelimit` with a sliding window of 5-10 attempts per 15 min.
- **Reference:** Auth.js does not rate limit credentials sign-in. Its docs say to implement this yourself (https://authjs.dev/getting-started/authentication/credentials).

### [MEDIUM] The 60s email cooldowns can be bypassed with concurrent requests, and registration has no limit, so email bombing is possible

- **Location:** `src/actions/auth.ts:98-100` and `125-126`, `src/lib/verification.ts:36-46`, `src/lib/password-reset.ts:39-49`, `src/app/api/auth/register/route.ts:36-62`
- **Issue:** The cooldown is a check-then-act sequence. It reads the newest token row, and only afterwards does `sendXLink` delete the old rows, insert a new one and send the email. The check and the send are not atomic, and there is no lock or unique constraint. The cooldown is stored in the database (good, not in memory), but parallel requests all pass the check before any of them writes a token.
- **Attack scenario:**
  1. The attacker fires about 50 simultaneous `requestPasswordReset({ email: victim })` calls, or `resendVerificationEmail` for an unverified account.
  2. Every call sees no token younger than 60s, so each one sends an email. The victim's inbox is flooded, and Resend quota and sender reputation are burned.
  3. Each call also deletes the previous token, so only the last link works.
  4. `POST /api/auth/register` has no cooldown at all. Anyone can register unlimited distinct addresses and have the app send a verification email to each one (arbitrary third parties). Each request also runs a bcrypt cost-12 hash.
- **Fix:** Make the cooldown atomic. Options are a per-email advisory lock or a conditional write, for example a unique row per identifier with `createMany({ skipDuplicates: true })` whose result gates the send, or `pg_advisory_xact_lock(hashtext(email))` in a transaction. Also add the IP/email limiter from the finding above to `/api/auth/register`, `requestPasswordReset` and `resendVerificationEmail`.
- **Reference:** Code path read end to end. No library behaviour is involved.

### [MEDIUM] JWT sessions are not invalidated after a password reset or password change

- **Location:** `src/auth.ts:54-67` (JWT strategy, `session` callback reads only `token.sub`), `src/lib/password-reset.ts:94-97`, `src/actions/profile.ts:52-55`
- **Issue:** Sessions are stateless JWTs and nothing ties them to the credential state. `resetPasswordWithToken` and `changePassword` update `passwordHash` but do not revoke anything. The `session` callback never re-reads the user, so an old JWT stays valid until it expires (the Auth.js default is 30 days).
- **Attack scenario:** An attacker holds a victim's session, for example from a shared or stolen device or an XSS-stolen cookie. The victim notices, resets or changes their password, and believes the attacker is locked out. The attacker's cookie keeps working for up to 30 days, including the `deleteAccount` action.
- **Fix:** Add a `sessionVersion Int @default(0)` column (migration). Put it in the JWT in a `jwt` callback at sign-in. Re-check it in the `session` callback (Node runtime in `auth.ts`, not the edge-safe config). Increment it in `resetPasswordWithToken` and `changePassword`. Sketch:
  ```ts
  async jwt({ token, user }) { if (user) token.sv = (await getVersion(user.id)); return token; },
  async session({ session, token }) { /* if DB version != token.sv, return an unauthenticated session */ }
  ```
  Alternatively switch to database sessions (the `Session` model already exists) and `deleteMany` the user's sessions on password change.
- **Reference:** Auth.js JWT strategy has no server-side revocation (https://authjs.dev/concepts/session-strategies). The same gap means a still-valid JWT for a deleted user is not rejected centrally. I checked that this has no data impact today: `getProfile` returns null, and `changePassword` and `deleteAccount` fail safely.

### [LOW] Password length limit is counted in characters, but bcrypt truncates at 72 bytes

- **Location:** `src/lib/validations/auth.ts:14-18`
- **Issue:** The comment says "bcrypt ignores anything past 72 bytes", but `.max(72)` counts UTF-16 code units. A password of 72 or fewer characters can exceed 72 UTF-8 bytes.
- **Attack scenario:** A user sets a 40-character passphrase of CJK or emoji characters (3-4 bytes each, more than 120 bytes). bcryptjs silently uses only the first 72 bytes, so the effective password is shorter than the user believes. Anyone who guesses the first 72 bytes can log in. Hashing and comparing are consistent, so login works. Impact is limited to users with long multi-byte passwords.
- **Fix:**
  ```ts
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 bytes")
  ```
  `Buffer` is fine here because the schema is only used on the server and in client bundles (use `new TextEncoder().encode(v).length` to stay isomorphic).
- **Reference:** bcrypt's 72-byte input limit (bcryptjs README).

## Passed Checks

### Password handling
- ✅ bcrypt cost 12 everywhere a hash is created: register (`src/app/api/auth/register/route.ts:43`), reset (`src/lib/password-reset.ts:71`), change password (`src/actions/profile.ts:54`).
- ✅ `authorize` validates with `signInSchema`, returns `null` for unknown email, wrong password and OAuth-only users (no `passwordHash`), and throws the unverified error only after the password matches (`src/auth.ts:26-43`). No unverified-vs-unknown leak.
- ✅ `passwordHash` is never put in the JWT or session, and `getProfile` selects it only to derive `hasPassword` before stripping it (`src/lib/db/profile.ts:53-56`). Nothing is logged except error objects.
- ✅ The `session` callback copies only `token.sub` into `session.user.id` (`src/auth.ts:58-63`).

### Rate limiting
- ✅ Cooldowns are enforced server side from DB rows, not from client timers or per-instance memory (see the Medium finding for the concurrency gap).
- ✅ Resend and forgot-password return the same response for unknown, verified and OAuth-only emails (`src/actions/auth.ts:81-134`).

### Email verification
- ✅ Tokens come from `crypto.randomBytes(32)` (256 bits), and only the SHA-256 hash is stored (`src/lib/tokens.ts:7-14`).
- ✅ Expiry (24h) is set at creation and checked at use. Expired rows are deleted (`src/lib/verification.ts:58-63`). Tokens are deleted on use, and earlier tokens are replaced on resend inside a transaction.
- ✅ Reset tokens cannot verify email. `verifyEmailToken` excludes the `password-reset:` prefix (`src/lib/verification.ts:50-55`), and `validTokenWhere` requires the prefix on the reset side.
- ✅ The user updated is the one named by the token's identifier (`src/lib/verification.ts:66-69`).
- ✅ With verification enabled, `authorize` is the only credentials path, and it enforces `emailVerified`. `EMAIL_VERIFICATION_ENABLED` is on unless the env var is exactly `"false"` (`src/lib/verification.ts:10-11`), which is documented in `.env.example`.
- ✅ Links are built from `AUTH_URL`, not the request `Host` header (`src/lib/verification.ts:7,30`).

### Password reset
- ✅ CSPRNG token, hash only at rest, 1h expiry enforced in the query (`expires: { gt: new Date() }`), and earlier tokens replaced (`src/lib/password-reset.ts:18-36,51-57`).
- ✅ The page checks the token (`reset-password/page.tsx:28`), and `resetPassword` re-validates it inside the transaction, so it never trusts the page.
- ✅ Consumption is atomic. `deleteMany` inside an interactive transaction returns `count === 0` for the losing concurrent request, since Postgres row locks make the second delete wait and then match zero rows (`src/lib/password-reset.ts:80-84`).
- ✅ Token deletion and the password update happen in the same transaction. Setting `emailVerified` on reset is intentional and not exploitable, because it requires inbox access.

### Profile and account actions
- ✅ `changePassword` and `deleteAccount` each call `auth()` and use only `session.user.id`. No client-supplied id is accepted (`src/actions/profile.ts:21,64`).
- ✅ `changePassword` verifies the current password with bcrypt, validates the new one with the shared schema, and handles OAuth-only users.
- ✅ `deleteAccount` checks the confirmation server side, deletes only the session user (cascade) and the matching token rows, then signs out.
- ✅ The proxy matcher covers `/dashboard/:path*` and `/profile/:path*`. The profile page handles a missing session and a missing user with redirects (`src/app/profile/page.tsx:27-30`).
- ✅ Every action validates input with Zod.

### Other
- ✅ `callbackUrl` is restricted to values starting with `/` but not `//` (`src/actions/auth.ts:33-39`). The value is then passed to Auth.js as `redirectTo`, whose default redirect callback prefixes relative paths with the base URL (so `/\evil.com` stays on-site). I did not step through the beta's source for this, so treat it as high confidence rather than verified.
- ✅ `allowDangerousEmailAccountLinking` is not set. A GitHub login for an email already registered with a password gets `OAuthAccountNotLinked`, so there is no takeover path.
- ✅ Error responses are generic (no Prisma errors or stack traces returned). Details go to `console.error` only.
- ✅ No hardcoded secrets and no `NEXT_PUBLIC_*` auth variables. Server-only helpers (`profile.ts`, `prisma`) are not imported into client files.
- ✅ `scripts/delete-users.ts` is a dry run unless `--confirm` is passed, protects the demo user, prints the target DB host, and is not importable from the web app.

## Notes

These are hardening ideas and accepted trade-offs, not vulnerabilities.

- Sign-up returns 409 for an existing email. This is an accepted trade-off, and because of it the otherwise careful enumeration hiding in the sign-in, resend and reset flows does not add much. A timing difference also exists (`authorize` skips bcrypt for unknown emails), but it is not worth fixing while the 409 exists.
- `resetPasswordWithToken` runs `bcrypt.hash` before checking the token (`src/lib/password-reset.ts:71`). An unauthenticated caller can burn CPU with arbitrary tokens. Moving the cheap token check first would help, and a limiter would cover it.
- Anyone who is signed in sees the seeded demo user's data on the dashboard (`src/lib/db/demo-user.ts`). This is documented as a temporary development scaffold in `context/current-feature.md`. It must be replaced with `session.user.id` scoping before real user data is stored.
- `.env.example` ships `EMAIL_VERIFICATION_ENABLED="false"`, which is documented. Make sure production sets it to `true` or removes it.
- If `AUTH_URL` is unset, emailed links fall back to `http://localhost:3000` (`src/lib/verification.ts:7`). This breaks links rather than leaking tokens, but production should fail fast if it is missing.
