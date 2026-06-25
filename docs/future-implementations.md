# Future Implementations

Deferred work that is intentionally not built yet. Each item explains *what*,
*why it was deferred*, and *how* to implement it when the time comes.

---

## Audit log `ipAddress` capture

### What
Record the IP address each **privileged action** came from, stored in the
existing `AuditLog.ipAddress` column. Answers the "from where?" part of audit's
"who did what, when, from where."

### Current state
- The `AuditLog` model already has an `ipAddress` column.
- `AuditService.log(input)` already accepts `input.ipAddress`.
- **Nothing populates it for audited actions** → every audit row currently lands
  with `ipAddress: null`.
- The only place an IP is captured today is **login**: `auth.controller.ts`
  reads `req.ip` and passes it to `AuthService.login`, which stores it as
  `lastLoginIp`. That is the precedent/pattern to follow.

### Why deferred
- It's a cross-cutting concern that touches many layers. The IP only exists at
  the HTTP layer (`req.ip`), but it's needed deep in the services where
  `AuditService.log` is called — and services are intentionally HTTP-agnostic
  (no access to `req`). So the value has to be carried ("threaded") from each
  controller down through each service method.
- It's an accountability/forensic nicety, **not functional** — no feature
  depends on it.
- **Locally it's meaningless anyway**: `req.ip` is `::1` / `127.0.0.1` in dev.
  It only becomes useful in production.

### The production gotcha (important)
Behind a proxy/load balancer (nginx, Render, Railway, etc.), `req.ip` defaults
to the **proxy's** IP, not the real client's. To get the real client IP, set:

```ts
app.set('trust proxy', true); // in app.ts
```

so Express reads `X-Forwarded-For`. Without this, every row logs the load
balancer's address. This must be done as part of (or before) implementing IP
capture.

### How to implement — two options

**Option A — Thread the parameter (simple, explicit)**
Add an optional `ipAddress?: string` param to each audited service method and
forward it into `AuditService.log`. Controllers pass `req.ip`.

```ts
// controller
await AdminService.deactivateUser(req.user!.userId, userId, req.ip);

// service
static async deactivateUser(actorId: string, userId: string, ipAddress?: string) {
  ...
  await AuditService.log({ actorId, action: 'USER_STATUS_CHANGED', /* ... */, ipAddress }, tx);
}
```

- Pros: dead simple, obvious data flow.
- Cons: adds `ipAddress?` to ~9 service signatures + their controllers; every
  *new* audited action must remember to thread it too.

Audited call sites to update (as of the audit-emission work):
- `professor.service`: `openAttendanceSession`, `closeAttendanceSession`,
  `cancelAttendanceSession`, `markAttendance`, excuse review
- `admin.service`: `dropStudent`, `deactivateUser`, RFID revoke,
  RFID request reject, excuse review, device register/revoke

**Option B — `AsyncLocalStorage` request context (cleaner, preferred)**
A middleware stashes per-request data (`req.ip`, maybe `req.user`) into a
request-scoped store at the start of every request; `AuditService.log` reads the
IP from that store directly. No parameter passing.

- Pros: one middleware + a small tweak to `AuditService.log`, then it's wired
  everywhere forever — new audited actions get the IP for free. The Node
  equivalent of a request-scoped DI/context.
- Cons: more upfront setup; data flow is slightly less obvious (implicit context
  vs explicit param).

Sketch:
```ts
// context.ts
import { AsyncLocalStorage } from 'async_hooks';
export const requestContext = new AsyncLocalStorage<{ ipAddress?: string }>();

// middleware (registered early in app.ts)
app.use((req, _res, next) => requestContext.run({ ipAddress: req.ip }, next));

// audit.service.ts — default ipAddress from context if not explicitly passed
const ip = input.ipAddress ?? requestContext.getStore()?.ipAddress;
```

### Recommendation
Prefer **Option B** when this is picked up (aligns with "implement what's best,
not what merely works"), and set `trust proxy` at the same time. Until then,
`ipAddress` stays `null` and nothing depends on it.
