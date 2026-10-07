# Docker Development

This setup is for local development with source bind mounts, hot reload, a private PostgreSQL service, persistent Docker data, and an explicitly invoked canonical seed.

## Prerequisite

`backend/.env` must exist before Compose starts. It supplies the existing required application secrets and email configuration:

- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Compose overrides Docker-specific values including `DATABASE_URL`, `FRONTEND_URL`, `PORT`, `NODE_ENV`, and `TZ`. The environment file is excluded from Docker build contexts and must not be committed.

## Architecture

```text
Host browser
  ├── http://localhost:5173 ──> frontend container (Vite)
  └── http://localhost:3000 ──> backend container (Express)
                                      │
                                      └── postgres:5432

External RFID terminal / ESP32
  └── http://<Mac-LAN-IP>:3000/device/attendance/tap
```

The services are:

- `postgres`: PostgreSQL 17 with a health check and persistent database volume.
- `migrate`: one-shot `npx prisma migrate deploy`; starts only after PostgreSQL is healthy.
- `backend`: Express with nodemon/ts-node hot reload; starts only after migration succeeds.
- `frontend`: Vite/Fast Refresh; starts independently from backend health.
- `seed`: destructive development fixture tool behind the `tools` profile; never starts during normal Compose startup.

The backend connects to `postgres:5432`. Browser API requests deliberately use `http://localhost:3000`; `backend` is a Compose-only hostname and is not resolvable by the host browser.

## Start and stop

First startup or rebuild:

```sh
docker compose up --build
```

Detached:

```sh
docker compose up -d --build
```

Status:

```sh
docker compose ps
```

All logs:

```sh
docker compose logs -f
```

Backend logs:

```sh
docker compose logs -f backend
```

Frontend logs:

```sh
docker compose logs -f frontend
```

Shutdown while preserving database and uploads:

```sh
docker compose down
```

`docker compose down` preserves named volumes. A later `docker compose up -d` reuses the PostgreSQL database and uploaded files.

> [!WARNING]
> `docker compose down -v` deletes the Docker PostgreSQL database, upload volume, and dependency volumes. It is not a routine shutdown command.

## Migrations and seed data

Normal startup applies checked-in migrations through the one-shot `migrate` service:

```text
postgres healthy -> migrate succeeds -> backend starts
```

It does not run `prisma migrate dev`, `prisma db push`, `prisma migrate reset`, or the development seed.

Create or restore the canonical development fixture only when explicitly desired:

```sh
ALLOW_DESTRUCTIVE_SEED=true docker compose --profile tools run --rm seed
```

This command is destructive: it replaces all application data in the Attendance Docker database. It does not delete migration history or physical uploads. See [development-seed.md](./development-seed.md) for credentials, fixture contents, and the recommended test order.

## Persistence and mounts

| Purpose | Mount/volume |
|---|---|
| PostgreSQL data | `postgres_data` named volume |
| Uploaded files | `backend_uploads` named volume at `/app/uploads` |
| Backend dependencies | `backend_node_modules` Linux named volume |
| Frontend dependencies | `frontend_node_modules` Linux named volume |
| Backend source | `./backend:/app` bind mount |
| Frontend source | `./frontend:/app` bind mount |

Host `node_modules` directories are not mounted into containers. Native packages such as `argon2` are installed for Linux in the backend image/volume. The Docker upload volume is fresh and does not reuse `backend/uploads` from the Mac.

PostgreSQL intentionally has no host port publication. The unrelated service already using host port 5432 does not conflict. Redis is not used by this application, so host port 6379 is irrelevant.

## Dependency changes

Rebuild the relevant image after changing a package manifest or lockfile:

```sh
docker compose build backend migrate seed frontend
```

Because dependency directories are named volumes, refresh the applicable Linux volume after a lockfile change:

```sh
docker compose run --rm --no-deps backend npm ci
docker compose run --rm --no-deps backend npx prisma generate
docker compose run --rm --no-deps frontend npm ci
docker compose up -d
```

These commands update only this Compose project's dependency volumes; they do not touch host `node_modules` or unrelated Docker projects.

## Hot reload and uploads

Vite runs on `0.0.0.0:5173` with Fast Refresh. The backend uses the existing `npm run dev` nodemon command. Both source trees are bind-mounted, so source edits normally appear without rebuilding.

Profile paths such as `/uploads/profiles/file.jpg` resolve against the Vite origin. During development, Vite proxies `/uploads` to:

- `DEV_API_PROXY_TARGET=http://backend:3000` in Compose;
- `http://localhost:3000` by default during non-Docker host development.

Polling is not enabled by default. If Docker Desktop for macOS misses frontend file events, temporarily set `CHOKIDAR_USEPOLLING=true` for the frontend service. For backend misses, nodemon can be run with its legacy-watch option as a troubleshooting measure. Polling consumes more CPU and should only be enabled when needed.

## LAN and ESP32 access

An ESP32 cannot use `localhost` to reach the Mac. Configure it with the Mac's LAN IP and published backend port 3000, and ensure the local firewall permits the connection.

Phone or LAN browser testing also requires a browser-visible API base URL using the Mac's LAN IP. That separate configuration is not part of this local-host setup.

# Production / Cloud Warning

The development seed is destructive and must never initialize a real production, cloud, staging, or shared database.

Production/cloud deployment should apply checked-in migrations with:

```sh
npx prisma migrate deploy
```

Production must not automatically run any of the following:

- `npx prisma db seed`
- `docker compose --profile tools run --rm seed`
- `prisma migrate reset`

The deterministic development accounts, shared password, RFID UID, and Device token must never be created in production.

Production requires a separate, deliberate mechanism for bootstrapping the first real Admin account. Do not solve production Admin creation by running the development seed.

## Known application limitations

This Docker implementation intentionally does not redesign current application behavior. Known limitations include:

- Professor session opening discovers schedule IDs through existing sessions and has no Device selector.
- The Student excuse picker excludes `LATE` records.
- Rejected excuse dates cannot be selected for resubmission in the current UI.
- The excuse modal uses UTC-based default date construction.
- Audit-log end-date filtering does not cover the entire final calendar day.
- Access-token refresh is not automatic in the frontend.
- CORS remains in its current permissive development configuration.
