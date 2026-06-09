# Next Session — Build the Login Feature (end-to-end)

The foundation is done. Tomorrow we build our first real feature, login, all the way
through the layers — and that's where the patterns in
[`react-mental-model.md`](./react-mental-model.md) finally click.

> Working style: Claude generates/explains code, you copy it manually.
> Source files are yours; docs are fine for Claude to write directly.

---

## ✅ Done tonight (foundation complete)

- **Deps installed:** `@tanstack/react-query`, `zod`, `axios`, `@tanstack/react-query-devtools`.
- **`@/` → `src/` alias** wired in both `vite.config.ts` and `tsconfig.app.json`
  (fixed the `paths` `"@/*": ["./src/*"]` gotcha — the `*` must appear on both sides).
- **`src/lib/api-error.ts`** — `ApiError` class (written field-by-field, no parameter
  properties, to satisfy `erasableSyntaxOnly`).
- **`src/api/client.ts`** — axios instance + request interceptor (Bearer token) +
  response interceptor (normalizes every failure to `ApiError`; success passes through
  so feature `*.api.ts` files do the `schema.parse(res.data.data)`).
- **`src/main.tsx`** — `QueryClientProvider` + Devtools wired around `<App/>`.
- **Folder skeleton:** `src/api`, `src/features`, `src/components`, `src/hooks`, `src/lib`, `src/routes`.
- **`npm run dev` boots cleanly.**
- **Backend contract mapped** → [`api-contract.md`](./api-contract.md) (source of truth for schemas).
- **Backend bugs fixed** (so the contract is honest): unhashed admin password, ignored
  `newPassword`, `createUser` password-hash leak, `attendance/summary` `success:false`,
  and the omitted-`data`-on-empty student endpoints (now always return `[]`).

---

## ✅ Login feature — Steps 1–3 done (last session)

Built layer by layer, contract-down. All copied in by the user.

- **Step 1 — Schema** `src/features/auth/auth.schema.ts`
  - `loginRequestSchema` (identifier, password — light validation, just "you typed something").
  - `loginResponseSchema` (`tokens` + `user{id,type,status}`), plus local
    `userTypeSchema`/`userStatusSchema` enums.
  - Exported inferred types: `LoginRequest`, `LoginResponse`, `UserType`, `UserStatus`.
  - 📌 Enums are local for now — **extract to a shared module the moment a 2nd feature
    (profile) needs them** (e.g. `src/lib/enums.schema.ts`). Don't copy-paste.
- **Step 2 — Data source** `src/features/auth/auth.api.ts`
  - `login(credentials)` → `apiClient.post('/auth/login')` → `loginResponseSchema.parse(res.data.data)`.
  - Thin on purpose: errors already normalized to `ApiError` by the client interceptor;
    `.parse()` (not `.safeParse()`) so contract drift throws loudly.
- **Step 3 — Use case + session state** (the auth-state decision, folded in)
  - **Decision made:** user/session in **React Context**; tokens in **`localStorage`**.
    Reason: the axios interceptor runs *outside* React and can't read Context, so tokens
    must live where a plain module can read them. Zustand deferred (not painful yet).
  - `src/lib/token-storage.ts` — `tokenStorage` helper (get/set/clear), single owner of the
    `accessToken`/`refreshToken` keys.
  - `src/api/client.ts` — request interceptor now reads `tokenStorage.getAccessToken()`
    (replaced the inline localStorage TODO).
  - `src/features/auth/auth.context.tsx` — `AuthProvider` + `useAuth()`
    (`user`, `isAuthenticated`, `setSession`, `clearSession`; memoized value/callbacks;
    throws if used outside provider).
  - `src/features/auth/auth.queries.ts` — `useLogin()` as `useMutation<LoginResponse, ApiError, LoginRequest>`;
    `onSuccess` → `setSession(data)`.
  - `src/main.tsx` — `<AuthProvider>` wraps `<App/>` inside `QueryClientProvider`.
  - React concepts written up in [`lecture-notes.md`](./lecture-notes.md).

---

## ✅ Step 4 — LoginPage — DONE (verified live)

`src/features/auth/pages/LoginPage.tsx` built and **working end-to-end against the
real backend**: RHF + `zodResolver(loginRequestSchema)`, submit → `useLogin().mutate`,
`isPending`/`isError` states wired, daisyUI card. Logged in with a real student
account; tokens land in localStorage, mutation resolves `success`. CORS was a
non-issue (backend uses open `app.use(cors())`).

Debugging detours along the way (all written up in `lecture-notes.md`): missing
declared deps + stale Vite cache (invalid hook call), `AuthProvider` not wired in
`main.tsx`, and an `errors.field.message &&` guard crashing on first render.

`App.tsx` currently renders `<LoginPage/>` directly as a **temporary** smoke-test —
routing replaces this next.

---

## 🧭 Decisions still open (after Step 4)

- **Routing + protected routes:** wire React Router 7, a public `/login` route, and a
  protected shell that redirects unauthenticated users. Role-based landing
  (STUDENT/PROFESSOR/ADMIN) from `user.type`.
- **Refresh rehydration (known gap):** on hard refresh, the token survives in localStorage
  but in-memory `user` resets to `null`. Fix belongs with routing: on app load, if a token
  exists, call the role's `/profile` endpoint to rehydrate `user`. Deliberately deferred.
- **CORS check:** first real network call is Step 4 — confirm the backend allows the Vite
  origin (`http://localhost:5173`). A network/CORS error on login is this, not your code.

---

### Reference docs
- [`react-mental-model.md`](./react-mental-model.md) — architecture + Flutter→React mapping.
- [`api-contract.md`](./api-contract.md) — every endpoint's request/response shape.
- [`lecture-notes.md`](./lecture-notes.md) — concept explanations (e.g. `erasableSyntaxOnly`).
