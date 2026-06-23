# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A school attendance monitoring system. The repo is a two-part monorepo with no root-level package manager:

- `backend/` — Express 5 + TypeScript REST API, PostgreSQL via Prisma 7 (the substantial part of the codebase).
- `frontend/` — React 19 + Vite + TailwindCSS 4 + daisyUI SPA, currently scaffolding only (`App.tsx` renders a single heading). React Router 7 is installed but no routes exist yet.

Each subproject has its own `package.json`. `cd` into the relevant directory before running commands.

## Role
- You, being a full stack developer with 25 years of expertise will be mentor in this project. You will not be editing the files in this codebase for me. Instead, you will generate it and I will copy manually. I will ask some areas I am not quite familiar especially with the frontend because I am currently learning React. Though, I have an experience in Flutter mobile app development and what I do is, I compare my mental model on how I develop on flutter and it helps me understand the concepts and implementation on different framework.
- **Git is mine to run, not yours.** For every git workflow (branch, add, commit, push, PR), do not execute the git commands yourself — instead provide me the exact commands to run, the commit message, and (when opening a PR) the PR title and description. I will run them manually.

## Git workflow notes
- **Default to the safe approach.** Prefer commands that *protect* local work over commands that *force/discard* it. For syncing after a merge, use `git pull` (fast-forwards when local is clean and behind; refuses and warns if I have uncommitted changes or local commits) — do not reach for `git reset --hard` as the routine sync.
- `git pull` = `git fetch` + `git merge origin/<branch>`; the merge is a fast-forward when local hasn't diverged. It integrates and never silently throws away local work.
- `git reset --hard origin/<branch>` is the **destructive** alternative: it force-points the branch at the remote and discards local commits *and* uncommitted changes with no warning. Only suggest it when the explicit intent is "throw away my local state and mirror the remote."
- Reset variants to keep straight: `git reset HEAD <file>` unstages a file (working tree untouched); `git reset --hard HEAD` discards uncommitted changes but stays on the current commit; `git reset --hard origin/<branch>` is the force-match-remote one above.
- **Canonical branch→PR→merge flow (this is the standing workflow; provide commands for these steps, I run them):**
  1. Branch off `main`, one branch per logical change — `git checkout main && git pull && git checkout -b <prefix>/<short-name>`. Prefixes: `feat/ fix/ chore/ refactor/ hotfix/`.
  2. Commit with Conventional Commits — stage **specific files** (`git add <files>`, never `-A` on the apps; review what's staged), then `git commit -m "type(scope): summary"`.
  3. Push & open the PR via `gh` — `git push -u origin <branch>` then `gh pr create --fill`.
  4. Self-review the diff, then `gh pr merge --squash --delete-branch` (one clean squashed commit on `main`, deletes remote + local branch). Sync with `git switch main && git pull`.
- **`gh pr create --fill` populates the PR title/body straight from the commits — so the commit message *is* the PR description (don't write the rationale twice).** Consequence: PR quality is downstream of commit quality. Trivial change → a one-line `-m` is fine; substantial change → write a commit *body* via heredoc (see the commit-message convention below) so `--fill` carries the real rationale into the PR.
- **Squash-merge message** defaults to the PR title + concatenated commit bodies — review it before confirming the merge so the final `main` commit reads cleanly (matters most on multi-commit branches).

## Coding principles
- I really like writing clean, maintainable, and readable code. We implement the industry standards and most efficient way in coding. We do not settle with code that 'works'. We implement what's best.

## Commands

### Backend (`cd backend`)
- `npm run dev` — run the API with nodemon + ts-node, auto-restart on changes (default port 3000).
- `npm run build` — compile TypeScript to `dist/`.
- `npm start` — run the compiled output (`node dist/index.js`).
- `npm run prisma:migrate` — create + apply a dev migration after editing `schema.prisma`.
- `npm run prisma:generate` — regenerate the Prisma client so types stay in sync with the schema.
- `npm run prisma:studio` — open the Prisma Studio DB GUI.
- `npx tsx prisma/seed.ts` — seed the database (wipes and repopulates; see `prisma.config.ts`).

Note: `.claude/settings.json` denies `prisma migrate` commands — do not run migrations without explicit user confirmation.

### Frontend (`cd frontend`)
- `npm run dev` — Vite dev server.
- `npm run build` — type-check (`tsc -b`) then `vite build`.
- `npm run lint` — ESLint over the project.
- Vite — build tool and dev server (already scaffolded)
- TypeScript — type safety (already scaffolded)
- Tailwind CSS v4 — utility-first CSS (installed)
- @tailwindcss/vite — official Vite plugin for Tailwind (installed)
- DaisyUI v5 — component library on top of Tailwind (installed)
- React Router v7 — client-side routing (about to install: react-router)
- Axios — HTTP client for calling backend Express API
- TanStack Query — server-state caching, refetching, loading/error handling
- React Hook Form — form state management
- Zod — schema validation, pairs with TypeScript for inferred types
- @hookform/resolvers — small adapter so React Hook Form can use Zod schemas
- React Context + hooks for things like auth status, theme, modals
Zustand — only if Context becomes painful; not installing now
- vite-plugin-pwa — turns the app into a progressive web app; we'll add this near the end once the app actually works, since PWA setup on top of an incomplete app is a debugging nightmare

There is no test runner configured in either subproject.

## Backend architecture

Request flow is a strict layered pipeline, one set of files per role (`student`, `professor`, `admin`, plus `auth`):

```
routes/ → middlewares (validate, authenticate, authorize) → controllers/ → services/ → Prisma → DB
```

- **`routes/*.route.ts`** — define endpoints and wire middleware. Mounted in `src/app.ts` under `/auth`, `/student`, `/professor`, `/admin`. Role routers call `router.use(authenticate, authorize('ROLE'))` once at the top to guard every route in the file (see `admin.routes.ts`).
- **`controllers/*.controller.ts`** — thin HTTP layer. Read `req`, call a service, return `{ success, message, data }`. They `try/catch` and forward errors via `next(error)` to the global handler rather than responding with errors directly.
- **`services/*.service.ts`** — all business logic and Prisma access, written as classes with `static` methods (e.g. `AuthService.login(...)`). Throw `AppError` for expected failures.
- **`validators/*.ts`** — Zod schemas applied through the `validate(schema, source)` middleware (`source` is `'body' | 'query' | 'params'`, default `'body'`). On body validation it overwrites `req.body` with the parsed result.

### Error handling
- Throw `new AppError(message, statusCode, errorCode)` (`src/utils/app-error.ts`) anywhere in services/controllers for expected failures.
- `errorHandler` (in `src/middlewares/error.middleware.ts`, registered last in `app.ts`) converts `AppError` to a JSON response with its status/code; anything else becomes a 500 `SERVER_ERROR`. `handleMulterError` runs just before it to translate Multer upload errors into `AppError`s.
- Response shape is consistent: success → `{ success: true, message, data }`; failure → `{ success: false, message, code }`; Zod validation failure → `{ success: false, message, errors: [{ field, message }] }`.

### Auth
- JWT access/refresh pair via `src/utils/token_utils.ts`. Token payload (`TokenPayload`) carries `userId`, `role`, and `type` (`'access' | 'refresh'`). Secrets and expiries come from env (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`).
- `authenticate` middleware verifies the `Bearer` access token and sets `req.user` (typed in `src/types/express.d.ts`). `authorize(...roles)` gates by `req.user.role`.
- Login is identifier-based and resolves the account type by lookup order: student by `studentNumber`, then professor by `employeeNumber`, then admin by `username`. Passwords are hashed with **argon2** (not bcrypt).

### Database (Prisma)
- Schema: `backend/prisma/schema.prisma`. Postgres connection is via the `@prisma/adapter-pg` driver adapter over a `pg.Pool` configured in `src/config/prisma.ts` (not Prisma's default connection management). `DATABASE_URL` comes from `backend/.env`.
- Central design: a single `User` model holds shared identity/auth fields; `Student` and `Professor` are 1:1 profile extensions linked by `userId`. Admins are `User` rows with `type = ADMIN` and no profile extension.
- Important: most domain relations (enrollments, attendance records, excuse letters, "recorded by", "cancelled by") reference **`User.id`**, not `Student.id`/`Professor.id`. A refactor (`refactor_use_user_id_references` migration) moved these to `User.id` — match that convention when adding relations.
- Models use `@map`/`@@map` to snake_case DB names while code uses camelCase. The domain covers Courses → Classes → ClassSchedules → AttendanceSessions → AttendanceRecords, plus ExcuseLetters (with ExcuseDates + ExcuseAttachments), AuditLogs, and Notifications. Status/role/type fields are Postgres enums.

### File uploads
- Multer disk-storage configs in `src/config/`: `profile-upload.ts` (field `profileImage`, JPEG only, 5MB, 1 file) and `attachment-upload.ts` (field `files`, JPEG ≤5MB or PDF ≤10MB, up to 3 files). Files are renamed to `<timestamp>-<random><ext>`.
- Saved under `backend/uploads/` (`profiles/`, `excuses/`) and served statically at `/uploads`.

### RFID cards & registration
- **Model:** `RfidCard` is a 1-to-many extension of `Student` (FK → `Student.id`, not `User.id` — it's a sibling of the student profile). Statuses are `ACTIVE` / `REVOKED`; **`REVOKED` is terminal**. Because `rfidNumber` is `@unique`, a revoked row *is* the permanent blacklist — that number can never be registered again, by anyone. A student's "verified" state is **derived** ("has an `ACTIVE` card"), not stored — there is no `verificationStatus` field.
- **The number is hardware-read, never typed.** A card's UID lives in its chip and is only obtainable by tapping it on a scanner — so no one (not even an admin) can know it without a reader.
- **Registration is student self-service (card *activation*), by design.** Flow: (1) admin physically hands a card to the student — this is the trusted, supervised step (chain of custody / identity check); (2) student logs in, opens the RFID page, and **taps the card on the terminal**; (3) the terminal posts the scanned UID to `PATCH /student/rfid/register` (`StudentService.registerRfid`), which binds the card to the account. This is safe *because the number is scanner-read, not student-entered* — a student can only register a card they physically hold, not a fabricated number. There is **no** admin "assign RFID" path; issuance-in-software is impossible without a reader.
- **`RfidRequest`** is the student's channel to request a card (`type`: `LOST` | `DAMAGED` | `NEW`; `status`: `PENDING` | `FULFILLED` | `REJECTED`; FK → `Student.id`, mirroring `RfidCard`; `resolvedBy` → `User.id` for the admin, mirroring `ExcuseLetter.approvedBy`). Rules: at most **one `PENDING` request per student**; **`LOST`/`DAMAGED` immediately revoke the active card in the same transaction as creating the request** (closes the misuse window the instant the student reports); `NEW` is for students with no active card. Admins see the queue (`AdminService.getRfidRequests`) and can `rejectRfidRequest`; there is **no fulfill endpoint** — a request **auto-closes to `FULFILLED`** when the student successfully registers a new card (so the request resolves the moment a working card actually exists; auto-closed requests have a null `resolvedBy`).

### Notifications & audit
- `NotificationService` and the `Notification` model back in-app alerts (absence alerts, excuse status changes, etc.). `AuditLog` records privileged actions (manual attendance, overrides, excuse decisions, session/enrollment/RFID/status changes) via the `AuditAction` enum.
- **Emission layer (partially wired):** `AuditService.log(input, client?)` (`src/services/audit.service.ts`) writes audit rows; pass a transaction client (`tx`) to make the audit **atomic with the action** it records, else it defaults to the global client. The standing pattern for privileged actions is **audit inside the `$transaction`, notification after commit via `NotificationService.safeCreate` (best-effort — a notification failure must never roll back or surface on the action)**. `AuditLog.entityId` is now `String` (UUID). **Currently wired:** excuse approve/reject and RFID revoke/request-reject (in `AdminService`). **Not yet wired:** attendance/session/enrollment/user-status actions, inbound notifications (excuse-submitted → reviewer, rfid-request → admins), and `ipAddress` capture (the column exists but nothing threads `req.ip` into services yet) — follow these same patterns when adding them.
- `AuditService.log` and `NotificationService.createNotification`/`safeCreate` take the **generated enum types** (`AuditAction`, `NotificationType`) — never pass raw strings or `as any` (see the enum-types convention below).

## Conventions
- TypeScript is `strict` with `noUncheckedIndexedAccess` on — array/index access yields `T | undefined`; handle it.
- Frontend (`frontend/`) has `erasableSyntaxOnly` on, which forbids TS syntax that emits runtime JS. Avoid `enum`, namespaces, and constructor parameter properties (`constructor(public readonly x: T)`); use `const` objects / union types instead of enums, and declare class fields explicitly + assign in the constructor body.
- Keep the route → controller → service → Prisma separation; do not put Prisma queries in controllers or HTTP handling in services.
- Services are static-method classes; new business logic should follow that pattern and surface failures as `AppError`.
- **Use Prisma-generated enum types — never re-type their values.** When a value is backed by a Prisma enum (`Semester`, `ClassStatus`, `VerificationStatus`, `ExcuseStatus`, `RfidRequestStatus`, `RfidRequestType`, etc.), import the generated type from `@prisma/client` and use it for service params, DTO/interface fields, and controller casts. **Do not** hand-write `'A' | 'B'` string-literal unions and **do not** widen to plain `string` — the schema is the single source of truth, and raw literals silently drift when the enum changes. For a deliberate *subset* of an enum (e.g. excuse review allows only `APPROVED`/`REJECTED`, not `PENDING`), derive it with `Extract<ExcuseStatus, 'APPROVED' | 'REJECTED'>` rather than retyping bare literals. The **one** exception is Zod `z.enum([...])` at the route boundary, which legitimately needs runtime string literals — but the service/DTO types those validated values flow into must still be the generated enum.
- **Commit messages: use a heredoc, not repeated `-m` flags.** When the message has a subject + body, write it with a quoted heredoc so the formatting (blank line after subject, wrapped paragraphs, trailer) stays intact:
  ```bash
  git commit -F - <<'EOF'
  type(scope): subject line

  Body paragraph explaining the what/why.

  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  EOF
  ```
  Quote the delimiter (`<<'EOF'`) so the shell doesn't expand backticks/`$` in the message. Don't stack multiple `-m` flags for multi-paragraph messages.
