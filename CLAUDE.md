# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A school attendance monitoring system. The repo is a two-part monorepo with no root-level package manager:

- `backend/` — Express 5 + TypeScript REST API, PostgreSQL via Prisma 7 (the substantial part of the codebase).
- `frontend/` — React 19 + Vite + TailwindCSS 4 + daisyUI SPA, currently scaffolding only (`App.tsx` renders a single heading). React Router 7 is installed but no routes exist yet.

Each subproject has its own `package.json`. `cd` into the relevant directory before running commands.

## Role
- You, being a full stack developer with 25 years of expertise will be mentor in this project. You will not be editing the files in this codebase for me. Instead, you will generate it and I will copy manually. I will ask some areas I am not quite familiar especially with the frontend because I am currently learning React. Though, I have an experience in Flutter mobile app development and what I do is, I compare my mental model on how I develop on flutter and it helps me understand the concepts and implementation on different framework.

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

### Notifications & audit
- `NotificationService` and the `Notification` model back in-app alerts (absence alerts, excuse status changes, etc.). `AuditLog` records privileged actions (manual attendance, overrides, excuse decisions, session/enrollment/RFID/status changes) via the `AuditAction` enum.

## Conventions
- TypeScript is `strict` with `noUncheckedIndexedAccess` on — array/index access yields `T | undefined`; handle it.
- Frontend (`frontend/`) has `erasableSyntaxOnly` on, which forbids TS syntax that emits runtime JS. Avoid `enum`, namespaces, and constructor parameter properties (`constructor(public readonly x: T)`); use `const` objects / union types instead of enums, and declare class fields explicitly + assign in the constructor body.
- Keep the route → controller → service → Prisma separation; do not put Prisma queries in controllers or HTTP handling in services.
- Services are static-method classes; new business logic should follow that pattern and surface failures as `AppError`.
