# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A school attendance monitoring system. The repo is a two-part monorepo with no root-level package manager:

- `backend/` — Express 5 + TypeScript REST API, PostgreSQL via Prisma 7.
- `frontend/` — React 19 + Vite + Tailwind 4 + daisyUI 5 SPA. Fully built out: three role areas (student / professor / admin), ~35 route-level pages, TanStack Query + axios + zod + react-hook-form.

Each subproject has its own `package.json`. `cd` into the relevant directory before running commands.

Companion docs (read these before working in their area — they are the source of truth, not this file):
- `frontend/UI-GUIDELINES.md` — the frontend's design system and conventions (color/theme tokens, toast-vs-modal-vs-banner, the loading/error/empty/success contract, component layering, responsive + PWA rules, background decoration spec). **Required reading before writing any UI.**
- `docs/future-implementations.md` — deliberately deferred work with the *why* and the *how* (e.g. audit `ipAddress` threading). Check here before "fixing" something that looks missing.
- `docs/esp32-firmware-reference.md` — wiring + sketch for the RFID tap terminal that drives `POST /device/attendance/tap`.
- `docs/git-workflow.md` — the long-form git reference behind the workflow summarized below.

## Role
- You, being a full stack developer with 25 years of expertise will be mentor in this project. You will not be editing the files in this codebase for me. Instead, you will generate it and I will copy manually. I will ask some areas I am not quite familiar especially with the frontend because I am currently learning React. Though, I have an experience in Flutter mobile app development and what I do is, I compare my mental model on how I develop on flutter and it helps me understand the concepts and implementation on different framework.
- **Git is mine to run, not yours.** For every git workflow (branch, add, commit, push, PR), do not execute the git commands yourself — instead provide me the exact commands to run, the commit message, and (when opening a PR) the PR title and description. I will run them manually.

## Git workflow notes
- **Default to the safe approach.** Prefer commands that *protect* local work over commands that *force/discard* it. For syncing after a merge, use `git pull` (fast-forwards when local is clean and behind; refuses and warns if I have uncommitted changes or local commits) — do not reach for `git reset --hard` as the routine sync.
- `git reset --hard origin/<branch>` is the **destructive** alternative: it force-points the branch at the remote and discards local commits *and* uncommitted changes with no warning. Only suggest it when the explicit intent is "throw away my local state and mirror the remote."
- Reset variants to keep straight: `git reset HEAD <file>` unstages a file (working tree untouched); `git reset --hard HEAD` discards uncommitted changes but stays on the current commit; `git reset --hard origin/<branch>` is the force-match-remote one above.
- **Canonical branch→PR→merge flow (this is the standing workflow; provide commands for these steps, I run them):**
  1. Branch off `main`, one branch per logical change — `git checkout main && git pull && git checkout -b <prefix>/<short-name>`. Prefixes: `feat/ fix/ chore/ refactor/ hotfix/`.
  2. Commit with Conventional Commits — stage **specific files** (`git add <files>`, never `-A` on the apps; review what's staged), then `git commit -m "type(scope): summary"`.
  3. Push & open the PR via `gh` — `git push -u origin <branch>` then `gh pr create --fill`.
  4. Self-review the diff, then `gh pr merge --squash --delete-branch`. Sync with `git switch main && git pull`.
- **`gh pr create --fill` populates the PR title/body straight from the commits — so the commit message *is* the PR description (don't write the rationale twice).** Trivial change → a one-line `-m` is fine; substantial change → write a commit *body* via heredoc so `--fill` carries the real rationale into the PR.
- **Squash-merge message** defaults to the PR title + concatenated commit bodies — review it before confirming the merge.
- **Commit messages: use a heredoc, not repeated `-m` flags.** When the message has a subject + body, write it with a quoted heredoc so the formatting stays intact:
  ```bash
  git commit -F - <<'EOF'
  type(scope): subject line

  Body paragraph explaining the what/why.
  EOF
  ```
  Quote the delimiter (`<<'EOF'`) so the shell doesn't expand backticks/`$`. **No `Co-Authored-By` trailer.**

## Coding principles
- I really like writing clean, maintainable, and readable code. We implement the industry standards and most efficient way in coding. We do not settle with code that 'works'. We implement what's best.

## Commands

### Backend (`cd backend`)
- `npm run dev` — nodemon + ts-node, auto-restart (port from `PORT`, default 3000).
- `npm run build` / `npm start` — compile to `dist/` / run the compiled output.
- `npm run prisma:migrate` — create + apply a dev migration after editing `schema.prisma`.
- `npm run prisma:generate` — regenerate the Prisma client so types stay in sync.
- `npm run prisma:studio` — DB GUI.
- `npx tsx prisma/seed.ts` — seed (wipes and repopulates; wired via `prisma.config.ts`).

`.claude/settings.json` **denies** `prisma migrate`, `git push`, `git reset --hard`, and `rm` — never run those; hand me the command instead.

### Frontend (`cd frontend`)
- `npm run dev` — Vite dev server. Needs `VITE_API_BASE_URL` in `frontend/.env` pointing at the API.
- `npm run build` — `tsc -b` then `vite build`. This is the type-check; run it before claiming a frontend change compiles.
- `npm run lint` — ESLint over the project.

There is no test runner configured in either subproject. `vite-plugin-pwa` is still not installed — PWA conversion is deliberately last (see UI-GUIDELINES §6 for the mobile/PWA requirements the UI is already written against).

## Backend architecture

Strict layered pipeline, one file per role (`student`, `professor`, `admin`) plus `auth`, `device`, `attachment`:

```
routes/ → middlewares (validate, authenticate, authorize) → controllers/ → services/ → Prisma → DB
```

- **`routes/*.route.ts`** — mounted in `src/app.ts` under `/auth`, `/student`, `/professor`, `/admin`, `/device`, `/attachments`. Role routers call `router.use(authenticate, authorize('ROLE'))` once at the top to guard the whole file.
- **`controllers/*.controller.ts`** — thin HTTP layer: read `req`, call a service, return `{ success, message, data }`, `next(error)` on failure. No Prisma here.
- **`services/*.service.ts`** — all business logic and Prisma access, static-method classes (`AuthService.login(...)`). Throw `AppError` for expected failures. No `req`/`res` here.
- **`validators/*.ts`** — Zod schemas applied via `validate(schema, source)` (`'body' | 'query' | 'params'`, default `'body'`). Shared schemas (pagination, id params, excuse review, profile update) live in `shared.validators.ts`.

### Startup & config
- `src/config/env.ts` parses `process.env` through Zod **once at boot** and `process.exit(1)`s with a readable list if anything required is missing/malformed. Import `env` from there — never read `process.env` directly in app code. Adding a new env var means adding it to that schema.
- `src/config/prisma.ts` builds the client over a `pg.Pool` + `@prisma/adapter-pg` driver adapter (not Prisma's default connection management) and pings the DB at import time.

### Error handling
- Throw `new AppError(message, statusCode, errorCode)` from `src/utils/app_error.ts` (note: snake_case filename, like `token_utils.ts` / `rfid_utils.ts`).
- `errorHandler` (registered last in `app.ts`) turns `AppError` into its status/code; anything else becomes a 500 `SERVER_ERROR`. `handleMulterError` runs just before it.
- Response shape: success → `{ success: true, message, data }`; failure → `{ success: false, message, code }`; Zod failure → `{ success: false, message, errors: [{ field, message }] }`. Paginated endpoints put `{ items, pagination }` in `data`.

### Pagination
`src/utils/pagination.ts` is the shared vocabulary: `getPaginationArgs({page, limit})` → Prisma `{ skip, take }`, `buildPaginationMeta(params, total)` → the `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }` envelope. Use it for every list endpoint; the frontend's `lib/pagination.ts` mirrors this shape exactly.

### Auth
- JWT access/refresh pair via `src/utils/token_utils.ts`; payload carries `userId`, `role`, `type`. Secrets/expiries from `env`. **Access tokens are verified statelessly** — no per-request DB lookup — so deactivation/revocation only fully bites when the access token expires and the refresh path re-checks the account. Keep `ACCESS_TOKEN_EXPIRY` short.
- `authenticate` verifies `Bearer` and sets `req.user`; `authorize(...roles)` gates by `req.user.role` (typed in `src/types/express.d.ts`).
- **`authenticateDevice`** is the separate hardware path: header is `Device <token>`, looked up by `tokenHash` against the `Device` table, rejected unless `status === 'ACTIVE'`, and it bumps `lastSeenAt` on every call. It sets `req.device` (no `req.user`) — device routes are never `authorize`d by role.
- Login is identifier-based, resolved in order: student `studentNumber` → professor `employeeNumber` → admin `username`. Passwords hashed with **argon2**.
- Password reset is token-by-email: `PasswordReset` rows store a hashed token with `expiresAt`/`usedAt`; `MailService.sendPasswordReset` sends the link via **Resend** (`RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`). `User.mustChangePassword` forces a change after an admin-created account's first login.
- `loginRateLimiter` (10 / 15 min, successful requests skipped) and `passwordResetRateLimiter` (5 / hr) from `src/middlewares/rate-limit.middleware.ts` guard those routes and return the same JSON error envelope with code `RATE_LIMITED`.

### The attendance engine (RFID tap)
`AttendanceEngine.resolveTap({ deviceId, rfidNumber })` in `src/services/attendance.service.ts` is the whole hardware path, reached only through `POST /device/attendance/tap`. Order of resolution, each step a distinct outcome the firmware displays:
1. Find the **`OPEN` session bound to that device** — none → `NO_OPEN_SESSION` (409).
2. Look up the card by normalized UID (`normalizeRfid`: trim, uppercase, strip spaces/`:`/`-` — always normalize before comparing) — missing or non-`ACTIVE` → `UNKNOWN_CARD` (404).
3. Find the student's pre-created `AttendanceRecord` for that session — missing → `NOT_ENROLLED` (409).
4. A record that is `isManual` or `EXCUSED` returns `SKIPPED_MANUAL`; one that already has `timeIn` returns `ALREADY_RECORDED` — **a tap never overwrites a human decision**.
5. Otherwise stamp `timeIn` and mark `PRESENT` / `LATE` against `env.ATTENDANCE_LATE_THRESHOLD_MINUTES` (minutes after `session.openedAt`).

### Database (Prisma)
- Schema: `backend/prisma/schema.prisma`; `DATABASE_URL` from `backend/.env`.
- A single `User` model holds shared identity/auth; `Student` and `Professor` are 1:1 profile extensions by `userId`. Admins are `User` rows with `type = ADMIN` and no extension.
- **Most domain relations (enrollments, attendance records, excuse letters, "recorded by", "cancelled by") reference `User.id`, not `Student.id`/`Professor.id`** (the `refactor_use_user_id_references` migration). Match that when adding relations. The exceptions are `RfidCard` and `RfidRequest`, which are siblings of the student profile and FK to `Student.id`.
- Models use `@map`/`@@map` to snake_case DB names while code stays camelCase. Domain: Courses → Classes → ClassSchedules → AttendanceSessions → AttendanceRecords, plus ExcuseLetters (ExcuseDates + ExcuseAttachments), AuditLogs, Notifications, Sessions, PasswordResets, RfidCards, RfidRequests, Devices. Status/role/type fields are Postgres enums.

### File uploads & attachment access
- Multer disk-storage configs in `src/config/`: `profile-upload.ts` (field `profileImage`, JPEG, 5MB, 1 file) and `attachment-upload.ts` (field `files`, JPEG ≤5MB or PDF ≤10MB, up to 3). Files renamed to `<timestamp>-<random><ext>`, saved under `backend/uploads/{profiles,excuses}/`.
- **Only `/uploads/profiles` is served statically.** Excuse attachments are sensitive and go through `GET /attachments/excuse/:attachmentId`, where `AttachmentService` authorizes per attachment: the owning student, a professor teaching one of the excuse's classes, or any admin. Never add a static mount for `uploads/excuses`.

### RFID cards & registration
- `RfidCard` is a 1-to-many extension of `Student`. Statuses `ACTIVE`/`REVOKED`; **`REVOKED` is terminal**. Because `rfidNumber` is `@unique`, a revoked row *is* the permanent blacklist — that number can never be registered again, by anyone. "Verified" is **derived** ("has an `ACTIVE` card"), never stored.
- **The number is hardware-read, never typed** — a UID is only obtainable by tapping the card on a reader.
- **Registration is student self-service (card *activation*), by design.** (1) An admin physically hands over the card — the trusted, supervised step; (2) the student opens the RFID page and taps it; (3) the terminal posts the scanned UID to `PATCH /student/rfid/register` (`StudentService.registerRfid`). Safe precisely because the number is scanner-read: a student can only register a card they physically hold. There is **no** admin "assign RFID" path.
- **`RfidRequest`** is the student's channel to request a card (`type`: `LOST | DAMAGED | NEW`; `status`: `PENDING | FULFILLED | REJECTED`; `resolvedBy` → `User.id`). At most **one `PENDING` per student**; **`LOST`/`DAMAGED` revoke the active card in the same transaction as creating the request**; `NEW` is for students with no active card. Admins see the queue and can reject; there is **no fulfill endpoint** — a request **auto-closes to `FULFILLED`** when the student registers a new card (auto-closed rows have a null `resolvedBy`).

### Notifications & audit
- `AuditService.log(input, client?)` writes audit rows; pass a transaction client (`tx`) to make the audit **atomic with the action** it records. Standing pattern for privileged actions: **audit inside the `$transaction`, notify after commit via `NotificationService.safeCreate` / `safeCreateMany`** (best-effort — a notification failure must never roll back or surface on the action).
- Currently wired: excuse approve/reject, RFID revoke/request-reject, user create/update, enrollment added. Still unwired: session/attendance/user-status actions, inbound notifications (excuse-submitted → reviewer, rfid-request → admins), and `ipAddress` capture — the column and the `AuditService` field exist but nothing threads `req.ip` yet (`login` → `lastLoginIp` is the precedent; see `docs/future-implementations.md` for the plan and the `trust proxy` gotcha).
- `AuditService.log` and the notification helpers take the **generated enum types** — never raw strings or `as any`.

## Frontend architecture

Feature-sliced, one folder per role under `src/features/`, with three sibling files carrying the data layer:

```
features/<role>/
  <role>.api.ts       # every HTTP call for that role; parses res.data.data through a zod schema
  <role>.schema.ts    # zod schemas + inferred types for those payloads
  <role>.queries.ts   # a <role>Keys key tree + one hook per endpoint (useQuery/useMutation)
  <Role>Layout.tsx    # nav config + <AppShell>, renders the role's <Outlet/>
  pages/              # route-level components
  components/         # feature-composed components (modals, etc.)
```

Shared: `components/ui/` (dumb primitives), `components/layout/AppShell.tsx`, `hooks/`, `lib/` (`enums`, `entities`, `pagination`, `format`, `api-error`, `token-storage`), `api/client.ts`, `routes/`.

**The `@/` alias means `src/`.** It is configured in *two* places that must agree — `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`paths`). Note there is no `baseUrl`: it's deprecated in TS 6 and would error the build.

### The data-flow contract (don't shortcut any layer)
1. **`api/client.ts`** — one axios instance, `baseURL` from `import.meta.env.VITE_API_BASE_URL`. A request interceptor attaches the bearer token; a response interceptor normalizes **every** failure (including network/no-response) into an `ApiError` carrying `status`, `code`, and `fieldErrors`. So every `onError` handler downstream can assume `ApiError`.
2. **`<role>.api.ts`** — the only place endpoints are named. Each function unwraps the envelope and `schema.parse(res.data.data)`, so callers get validated, typed data or a loud throw if the backend drifts. Object schemas strip unknown keys, so declare only fields the UI reads — a new backend field never breaks a screen.
3. **`<role>.queries.ts`** — components never call axios or `useQuery` inline. Each role exports a namespaced key tree (`studentKeys.excuse(id)`, …) so mutations invalidate precisely; mutations fire toasts via `useToast()` in `onSuccess`/`onError`.
4. **Pages** — call a hook, branch on state, render. Wrap data views in `<DataState>` (`components/ui/DataState.tsx`), which encodes UI-GUIDELINES §3: skeleton on `isPending` (**not** `isFetching`, so a background refetch never re-skeletons a loaded screen), error banner with retry, empty slot, then `children(data)`.

### Auth & routing
- **Tokens live in `lib/token-storage.ts` (localStorage), deliberately outside React** — the axios interceptor is a plain module and cannot read Context. React state holds the *user*; localStorage holds the *tokens*.
- `AuthProvider` exposes `{ status: 'loading' | 'authenticated' | 'unauthenticated', user, isAuthenticated, setSession, clearSession }`. On mount, if a token exists it re-hydrates via `GET /auth/me`; the `'loading'` state exists so a refresh doesn't flash the login page.
- `routes/router.tsx` is the single route table. Each role area nests under `<ProtectedRoute allow={["ROLE"]} />` → role `Layout` → pages in its `<Outlet/>`. Authorization is declared once per group, never per page.
- Redirect targets come from `routes/landing.ts` (`landingPathFor(type)`) — the one place that maps a role to its home path. `RootRedirect` handles `/`.
- **Never navigate manually after logout**: `clearSession()` flips status and `ProtectedRoute` redirects on its own.
- Provider order in `main.tsx`: `QueryClientProvider` → `ToastProvider` → `AuthProvider` → `App`. Query defaults: `staleTime` 60s, `retry` 1, `refetchOnWindowFocus` off.

### Frontend conventions
- **`erasableSyntaxOnly` is on** — no `enum`, no namespaces, no constructor parameter properties (`constructor(public readonly x: T)`). Use `const` objects / union types, and declare class fields explicitly then assign in the constructor body (see `lib/api-error.ts`).
- `verbatimModuleSyntax` is on — type-only imports must be written `import type { X } from ...`.
- **`lib/enums.ts` is the single frontend mirror of the backend's Postgres enums.** Closed sets the UI branches or styles on are real `z.enum()`s; open-ended display-only sets (notification type, audit action) are left as `z.string()` on purpose so a new backend variant renders instead of throwing. Don't re-declare an enum inside a feature schema — import it.
- **`lib/entities.ts`** holds cross-feature sub-schemas (course/professor/class/session summaries) that appear in student, professor *and* admin payloads. The rule is "don't copy-paste, lift": the moment a second feature needs a schema, move it here.
- Never hardcode a hex color — use the daisyUI semantic classes. Two themes ship (`attendance`, `attendance-dark`); check every new component in both.
- Everything else UI — states, toast vs modal vs banner, responsive/adaptive breakpoints, touch targets, accessibility — is in `frontend/UI-GUIDELINES.md`. Follow it; deviate only with a stated reason.

## Cross-cutting conventions
- TypeScript is `strict` with `noUncheckedIndexedAccess` on in the backend — array/index access yields `T | undefined`; handle it.
- Keep the route → controller → service → Prisma separation on the backend and the page → hook → api → client separation on the frontend. No Prisma in controllers, no HTTP handling in services, no axios in components.
- **Use Prisma-generated enum types on the backend — never re-type their values.** Import the generated type from `@prisma/client` for service params, DTO/interface fields, and controller casts. Do **not** hand-write `'A' | 'B'` unions and do **not** widen to `string`. For a deliberate *subset* (excuse review allows only `APPROVED`/`REJECTED`), derive it: `Extract<ExcuseStatus, 'APPROVED' | 'REJECTED'>`. The one exception is Zod `z.enum([...])` at the route boundary, which needs runtime literals — but the service/DTO types those values flow into must still be the generated enum. (The frontend's `lib/enums.ts` is the deliberate mirror of this, since it can't import from Prisma.)
