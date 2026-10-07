# Development Seed

> [!CAUTION]
> # DEVELOPMENT ONLY
>
> This seed deliberately deletes and recreates all application data in the configured database. The accounts, password, RFID UID, and Device token below are intentionally predictable local-development fixtures. Never use this seed or these credentials in a cloud, shared, staging, or production database.

The seed is not part of normal application startup. `docker compose up` and `docker compose up --build` apply migrations but do not create fixture data.

Run the canonical reset explicitly from the repository root:

```sh
ALLOW_DESTRUCTIVE_SEED=true docker compose --profile tools run --rm seed
```

The command refuses to run when `NODE_ENV=production` or when `ALLOW_DESTRUCTIVE_SEED` is not exactly `true`. It prints the target database host and name without printing database credentials before it deletes anything.

## Development credentials

All three accounts use the same development-only password: `DevOnly123!`.

| Role | Login identifier | Name |
|---|---|---|
| Admin | `admin.dev` | Andrea Cruz |
| Professor | `PROF-DEV-001` | Prof. Paulo Reyes |
| Student | `STU-DEV-001` | Sofia Santos |

Professor login uses the employee number, not the Professor username. Student login uses the student number, not the Student username.

## RFID and Device fixture

- RFID UID: `04A1B2C3D4`
- Device label: `Development Room 301 Terminal`
- Device token: `dev_seed_attendance_terminal_000000000001`

The database stores only the SHA-256 hash of the Device token. The plaintext value above is intentionally documented for local testing and must never be used as a production credential.

The seed creates an open CS101 session bound to this Device and an initial `ABSENT` record with no check-in time. A development terminal request can exercise it with:

```http
POST /device/attendance/tap
Authorization: Device dev_seed_attendance_terminal_000000000001
Content-Type: application/json

{"rfidNumber":"04A1B2C3D4"}
```

A tap within the configured late threshold records `PRESENT`; a later tap records `LATE`. A repeated tap reports that attendance has already been recorded.

## Canonical fixture

The reset creates:

- exactly 3 Users: one Admin, one Professor, and one Student;
- 2 Courses and 2 active Classes, both taught by the Professor;
- 2 active enrollments for the Student;
- 2 schedules based on the current `Asia/Manila` calendar;
- 7 AttendanceSessions and 6 AttendanceRecords;
- historical `PRESENT`, `LATE`, `ABSENT`, and `EXCUSED` examples;
- one Device-bound open session ready for an RFID tap;
- one future scheduled session with no attendance record;
- 3 ExcuseLetters and 3 ExcuseDates: pending, approved, and rejected;
- no fake attachment rows;
- one active RFID card and one fulfilled historical new-card request;
- 4 Notifications and 5 AuditLogs.

Dates are derived from one frozen seed instant. Historical sessions are placed 28, 21, 14, 7, and 1 day before the current Manila date. The current session is today, and the second class is scheduled later today when possible or tomorrow otherwise.

## Recommended testing order

1. Log in as Student and inspect the dashboard, classes, attendance, excuses, notifications, RFID card, and profile.
2. Exercise the RFID tap while the card and Device-bound session are still active.
3. Log in as Professor and inspect classes, sessions, roster, report, excuses, notifications, and profile.
4. Review the pending excuse or manually modify attendance.
5. Log in as Student and optionally report the RFID card as `LOST` or `DAMAGED`.
6. Log in as Admin and inspect the resulting pending RFID request, Device, attendance, excuses, and audit log.
7. Run the explicit seed command again to restore the canonical state.

Reseeding is destructive. It removes runtime mutations such as reviewed excuses, closed sessions, revoked cards, newly created users, and additional Devices. It preserves Prisma migration history and does not delete physical upload files.
