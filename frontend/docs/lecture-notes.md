# Lecture Notes

Concepts explained as they come up while building the frontend. Newest at the bottom.

---

## `erasableSyntaxOnly` — "TypeScript that's just JavaScript with labels"

**When it came up:** writing the `ApiError` class. The constructor shortcut
`constructor(public readonly status: number)` errored with
*"The syntax is not allowed when 'erasableSyntaxOnly' is enabled."*

### The core idea

TypeScript can't run directly — something must turn it into plain JavaScript first by
**removing the type stuff**. There are two kinds of TS syntax:

**1. Erasable syntax — just delete it and valid JS remains:**
```ts
const name: string = "Kirk"
```
becomes
```js
const name = "Kirk"
```
The `: string` was just a label. Delete it → JS still works.

**2. Syntax that actually *builds* JavaScript — you can't just delete it:**
```ts
enum Role {
  Admin,
  Student,
}
```
To make this work, the compiler has to *generate* hidden code:
```js
var Role = {};
Role[Role["Admin"] = 0] = "Admin";
Role[Role["Student"] = 1] = "Student";
```
That's not "removing types" — it's **inventing new code**.

### What the flag does

`erasableSyntaxOnly: true` says: *"Only allow TS features you can erase by deletion.
Ban the ones that secretly generate JavaScript."*

### Why anyone wants it

Newer, faster tools (Node running `.ts` directly, esbuild, etc.) are **type strippers** —
deliberately dumb: they just delete type annotations and run what's left. That's why
they're fast. Features like `enum` make them choke. The flag keeps code compatible with
all of them.

### The concrete example

Banned — the shortcut secretly generates `this.status = status`:
```ts
class ApiError extends Error {
  constructor(public readonly status: number) {  // ❌ hidden code
    super("oops")
  }
}
```

Allowed — nothing hidden; declare the field, assign it in plain view:
```ts
class ApiError extends Error {
  readonly status: number          // declare the field

  constructor(status: number) {
    super("oops")
    this.status = status            // assign it yourself, visibly
  }
}
```

Same result. The difference: every line in the second version is either an erasable
type or normal JavaScript — nothing happening off-screen.

### Takeaway (also recorded in CLAUDE.md)

In the frontend, write TypeScript that's "just JavaScript with type labels on it."
Avoid the few features that quietly emit extra code:
- ❌ `enum` → ✅ use a `const` object + union type
- ❌ constructor parameter properties (`constructor(public readonly x: T)`)
  → ✅ declare fields explicitly + assign in the constructor body
- ❌ namespaces

---

## Auth session state — the React concepts behind the design

**When it came up:** Step 3 of the login feature — deciding where the logged-in
user and the tokens should live.

### Context is only readable *inside* components

React Context is delivered through the component tree. You read it with a hook
(`useContext`) from inside a component. A plain module that isn't a component —
like our axios request interceptor — **cannot reach into Context.**

- **Use case:** share state that the UI must react to (the logged-in user, theme,
  modals) with any component, without "prop-drilling" it down through every level.
- **The consequence we hit:** the token can't live only in Context, because the
  interceptor (outside React) needs to read it. So tokens go to `localStorage`
  (readable anywhere, survives refresh) and the *user* goes in Context. Split by
  who needs to read it.
- **Flutter parallel:** Context ≈ an `InheritedWidget` / `Provider.of<T>(context)` —
  available to the widget subtree, not to arbitrary plain Dart code.

### React state is memory-only; localStorage persists

`useState` lives in memory and is wiped on a full page refresh. `localStorage`
survives. That's why after refresh the token is still there but the in-memory
`user` resets to null — and why "rehydrate the user on app load" is a real step
we have to build later.

- **Use case:** `useState`/Context for live UI state; `localStorage` (or a backend
  call) for anything that must outlive a reload.

### The `createContext(undefined)` + throwing custom-hook pattern

Create the context with no default value, then expose a custom hook (`useAuth`)
that reads it and **throws** if it's used outside its Provider.

- **Use case:** guarantees a consumer is actually wrapped in the Provider. Instead
  of silently getting `undefined` and crashing three lines later with a vague
  error, you fail loudly and immediately with a clear message. Consumers also stop
  having to null-check the context itself.
- **Flutter parallel:** like the assert you get from `Provider.of<T>` when no
  matching provider exists above you — but turned into an explicit, readable error.

### `useMemo` / `useCallback` — stable references to avoid needless re-renders

A component re-renders its consumers when the value it hands them is a **new
object reference**. Building a fresh `{ user, login, logout }` object every render
hands every consumer a "new" value each time, re-rendering them all even when
nothing changed. `useMemo` (for the value object) and `useCallback` (for the
functions inside it) keep the *same reference* until a real dependency changes.

- **Use case:** wrap a Context Provider's `value` (and the callbacks in it) so
  reading components only re-render when the data actually changes — not on every
  parent render. Also any time you pass an object/function as a prop to a memoized
  child.
- **Flutter parallel:** the same instinct as `const` constructors — don't rebuild
  what hasn't changed, so the framework can skip work.

### `useMutation` vs `useQuery` — actions vs reads

TanStack Query splits server interactions in two. `useQuery` is for **reads** you
want cached, auto-refetched, and shared (GET-like). `useMutation` is for
**actions** that change something and run on demand (login, create, update,
delete) — it doesn't auto-run; you fire it with `.mutate(...)`, and it hands you
`isPending`, `error`, and an `onSuccess` hook.

- **Use case:** login is a one-shot action triggered by a button, so it's a
  `useMutation`. Fetching the profile afterward is a cached read, so that'll be a
  `useQuery`.
- **Flutter parallel:** roughly the difference between a stream/future you watch
  for display vs. a one-off command you dispatch from a button tap.

---

## Fast Refresh — "a file should export only components"

**When it came up:** `auth.context.tsx` warned
*"Fast refresh only works when a file only exports components. Use a new file to
share constants or functions between components."* The file exported both the
`AuthProvider` component **and** a `useAuth` hook + the context object.

### What Fast Refresh is

Fast Refresh is React's hot-module-replacement in dev: when you save, it swaps the
changed component **while preserving its state** (form input, toggles, etc. survive
the edit). It's React's version of Flutter's **hot reload** — and, like hot reload,
it has rules about what it can safely swap.

### The rule

Fast Refresh can only do that state-preserving swap if a file exports **only
components**. The moment a file *also* exports a non-component — a hook, a plain
function, a constant, a context object — React can't safely hot-swap it and falls
back to a **full page reload** on every edit (you lose state). The linter
(`react-refresh/only-export-components`) warns you about the lost optimization.

### The fix

Split by export kind:
- Non-component things (the `createContext` object, the `useAuth` hook, types) go in
  their own file — a file that exports **zero** components, so the rule doesn't
  apply to it.
- The component (`AuthProvider`) goes in its own `.tsx`, exporting **only** the
  component.

- **Use case:** any "context + provider + hook" trio — keep the provider component
  alone in its file, and the context object + hook together in a separate
  (component-free) file.
- **Note:** a file with *no* component exports is exempt — a hook and a context
  object can happily share one file. The rule only bites when components and
  non-components mix in the *same* file.
- **Flutter parallel:** same spirit as hot reload's limits — some edits (changing a
  `main()`, top-level state) force a full restart instead of a hot reload. Structure
  your files so the cheap path stays available.

---

## Declared vs. transitive dependencies (and the Vite cache)

**When it came up:** the first login attempt white-screened with *"Invalid hook
call… Cannot read properties of null (reading 'useEffect')"* inside
`QueryClientProvider`.

### What actually happened

`@tanstack/react-query`, `axios`, and `zod` were being *used* in code but were not
listed in `package.json` `dependencies`. They were only reachable **transitively**
(e.g. `zod` came in under `eslint-plugin-react-hooks`). A clean reinstall pruned the
undeclared ones, so `react-query`/`axios` vanished from `node_modules` — yet the app
still tried to run because **Vite's pre-bundle cache** (`node_modules/.vite`) was
serving a stale optimized copy of `react-query` from when it worked. That cached
bundle carried mismatched React internals → the "invalid hook call / null dispatcher"
crash.

### Two lessons

1. **If you `import` it, declare it.** Every package your code imports must be a
   direct entry in `package.json`. Relying on a transitive copy is a time bomb — the
   day the middleman drops or bumps it, your imports break for no visible reason.
   Fix: `npm install <pkg>` so it's saved explicitly.
2. **The Vite `.vite` cache can serve ghosts.** After dependency changes, weird
   "Invalid hook call" / "two copies of React" / "dispatcher is null" errors are
   often a *stale optimize cache*, not your code. Fix: `rm -rf node_modules/.vite`
   then restart the dev server so Vite re-bundles from scratch.

- **Use case / habit:** dependency-shaped errors right after an install or reinstall
  → reinstall the missing deps *and* clear `.vite` before debugging your own code.
- **Flutter parallel:** like a corrupted `.dart_tool`/build cache after changing
  `pubspec.yaml` — sometimes the fix is `flutter clean`, not editing your code.

---

## `&&` rendering guards must check the object, not its property

**When it came up:** `LoginPage` crashed with *"Cannot read properties of undefined
(reading 'message')"* on first render. The guard was
`{errors.identifier.message && (...)}`.

### The trap

A component renders **eagerly, before any async/validation state exists**. On the
first paint, `errors.identifier` is `undefined`. Writing
`errors.identifier.message &&` reaches *through* the undefined object to grab
`.message` — and throws before `&&` can short-circuit.

### The rule

Guard on the **container first**, then read its property — or optional-chain:
- ✅ `errors.identifier && <span>{errors.identifier.message}</span>`
- ✅ `errors.identifier?.message && (...)`
- ❌ `errors.identifier.message && (...)`  ← dives into a maybe-undefined object

- **Use case:** any value that's empty on first render and filled later (RHF
  `errors`, a mutation's `error`/`data`, a query result). Check it exists before
  reading into it.
- **Flutter parallel:** exactly Dart's `?.` null-aware access — `user?.name` instead
  of `user.name` when `user` might be null. React renders `undefined`/`false` as
  nothing, so a short-circuited guard safely shows empty output instead of crashing.

---

## A `useEffect` callback can't be `async` — define an inner async function

**When it came up:** rehydrating the session in `AuthProvider` — we needed
`await getMe()` inside an effect, but preferred `async/await` over `.then().catch()`.

### The rule

`useEffect`'s callback must return **either nothing or a cleanup function.** An
`async` function *always* returns a Promise — so if you write
`useEffect(async () => { … })`, React receives a Promise where it expects a cleanup
function, and your cleanup silently stops working (plus a warning).

### The pattern

Keep the effect callback **synchronous**; declare an `async` function *inside* it and
call it. The async work is quarantined; the effect still returns its cleanup.

```
useEffect(() => {
  let cancelled = false
  const run = async () => {
    try { /* await … */ } catch { /* … */ }
  }
  run()
  return () => { cancelled = true }   // cleanup still works
}, [])
```

- **Use case:** any time an effect needs `await` — fetching on mount, subscriptions,
  bootstrapping. This "inner async function" shape is the standard React idiom.
- **`cancelled` flag:** guards against setting state after unmount (and against
  StrictMode's intentional double-mount in dev). Check it after each `await` before
  calling a state setter.
- **`catch {` with no binding:** valid JS (optional catch binding) — use it when you
  don't inspect the error, to signal "any failure means the same thing."
- **Flutter parallel:** in Dart you'd just mark the method `async` and `await`
  freely. React adds one wrinkle — the *effect* itself can't be the async function,
  because its return value is reserved for cleanup. So you nest the async call.

---

## TypeScript has no "warning" level — move soft rules to ESLint

**When it came up:** unused variables were flagged as hard red errors mid-writing.
Two tools were doing it: the TS compiler (`noUnusedLocals`/`noUnusedParameters` in
`tsconfig`) and ESLint (`@typescript-eslint/no-unused-vars`).

### The core distinction

- **TypeScript is binary: error or off.** A check is either on (and *blocks* the
  build / shows red) or disabled. There is no "just warn me."
- **ESLint has severity levels: `'off' | 'warn' | 'error'`.** A `'warn'` shows a
  yellow hint and never fails the build.

So for any rule you want to be *advisory* rather than *blocking* — unused vars,
style preferences — let **ESLint** own it as a `'warn'`, and turn the equivalent
**TS** hard-check off. Keep TS focused on what it's uniquely good at: type
correctness (which *should* hard-fail).

### The `_` escape-hatch convention

`@typescript-eslint/no-unused-vars` can ignore identifiers prefixed with `_`
(`argsIgnorePattern: '^_'`, etc.). Prefix something *intentionally* unused with `_`
and it goes silent; genuinely-forgotten ones still warn. That's the line between
"deliberate" and "mistake":
- `catch (_err)`, `const [, setX] = useState()`, `function f(_unusedArg, x)` → silent
- `const total = …` you forgot to use → still warns

- **Use case / mental model:** decide per rule *"is this a real error or a nudge?"*
  Real errors → TS or ESLint `'error'` (blocking). Nudges → ESLint `'warn'`. Don't
  use TS for nudges; it can't do soft.
- **Flutter parallel:** Dart's `analysis_options.yaml` severities (`error`/`warning`/
  `info`) — same idea of tuning how loud each lint is, rather than all-or-nothing.
