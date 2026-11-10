# MailBox

[![CI](https://github.com/Baptiste-baba/mailbox/actions/workflows/ci.yml/badge.svg)](https://github.com/Baptiste-baba/mailbox/actions/workflows/ci.yml)

Self-hosted, AI-first email client for Gmail and Outlook. One instance serves one user.

> Under construction: not usable yet.

## Installation

MailBox runs with Docker Compose: PostgreSQL, the api (which also serves the web app) and the worker.
The images are published on the GitHub container registry, for amd64 and arm64; the source code is
not needed.
1. In an empty folder, download `compose.yaml` and the configuration template:

   ```bash
   curl -fsSLO https://raw.githubusercontent.com/Baptiste-baba/mailbox/main/compose.yaml
   curl -fsSL -o .env https://raw.githubusercontent.com/Baptiste-baba/mailbox/main/.env.example
   ```

2. Fill in `.env`. Generate the database password with `openssl rand -hex 32` and the secret key
   with `openssl rand -base64 32`, and keep a copy of that key outside the machine. Keep the database
   folder on an SSD, and the backup folder on another disk when the machine has one.
3. Create both folders, and give the backup folder to the user the worker runs as:

   ```bash
   mkdir -p data/database data/backups
   sudo chown 1000:1000 data/backups
   ```

4. Start everything with `docker compose up --detach`.

The app then listens on `127.0.0.1:3000` (or `MAILBOX_PORT`), reachable from the machine itself
only. Put an HTTPS endpoint in front of it, such as `tailscale serve`, to reach it from other devices.

Each service has a memory and CPU limit (1.4 GB of memory in total), restarts on its own after a
failure, and, for the api and the worker, runs without any Linux privilege on a read-only filesystem.

### Creating your account

On its first start, the app asks for a setup code, which only whoever runs the server can read: the
api writes it to its logs, valid for an hour. Restarting the api (`docker compose restart api`)
writes a new one.

```bash
docker compose logs api | grep "setup code"
```

Then choose a username and a password, set up an authenticator app (the one of your password
manager, Google Authenticator or any other app showing 6-digit codes) and keep the ten recovery
codes somewhere safe. Signing in asks for the password and a code of the app; a recovery code works
once in place of the app, and asks to set up a new one. Setting up a new app signs out every other
device, in case one of them was lost. A session lasts 30 days after its last use.

Sessions only work over HTTPS, such as `tailscale serve` gives, or on `localhost`.

### Lost access

Without the password, or without both the authenticator app and the recovery codes, reset the
access from the server. This erases the password, the authenticator app, the recovery codes and
every session, keeps mailboxes and mail, and prints a new setup code:

```bash
docker compose exec api node dist/reset-auth.js
```

Changing `MAILBOX_SECRET_KEY` makes the stored authenticator secret unreadable: reset the access
afterwards.

### Updating

`MAILBOX_VERSION` chooses what to run: `main` follows every validated change, a version number such
as `0.1.0` stays on that release. To update, pull the new images and recreate the containers, either
with the update button of a Docker interface or with:

```bash
docker compose pull && docker compose up --detach
```

Database migrations run on their own when the api starts. Every image is also tagged
`sha-<commit>`, to go back to an exact earlier version.

## Configuration

Services read their configuration from environment variables, validated at startup: a missing or
invalid variable stops the service with an explicit message. With Docker Compose, `compose.yaml`
sets them from `.env`; the table below matters to run a service on its own.

| Variable             | Used by     | Required | Default     | Purpose                                                        |
| -------------------- | ----------- | -------- | ----------- | -------------------------------------------------------------- |
| `DATABASE_URL`       | api, worker | yes      |             | PostgreSQL connection string (`postgres://…`)                  |
| `MAILBOX_SECRET_KEY` | api         | yes      |             | 32 bytes in base64 encrypting the secrets kept in the database |
| `API_HOST`           | api         | no       | `127.0.0.1` | Address the api listens on (`0.0.0.0` inside a container)      |
| `API_PORT`           | api         | no       | `3000`      | Port the api listens on                                        |
| `WEB_DIRECTORY`      | api         | no       |             | Built web app (`apps/web/dist`) to serve; unset, API only      |
| `BACKUP_DIRECTORY`   | worker      | yes      |             | Folder receiving the nightly database backups                  |
| `WORKER_HEALTH_PORT` | worker      | no       | `3001`      | Port of the worker health check, bound to loopback only        |
| `TRUSTED_PROXIES`    | api         | no       |             | Proxies whose `X-Forwarded-For` names the device (see below)   |
| `LOG_LEVEL`          | api, worker | no       | `info`      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `TZ`                 | worker      | no       | `UTC`       | Time zone, e.g. `Europe/Paris`; sets the hour of the backup    |

`TRUSTED_PROXIES` lists addresses, subnets (`172.16.0.0/12`) or the names `loopback`, `linklocal`
and `uniquelocal`, separated by commas. Failed sign-ins slow down the device that made them, known
from the `X-Forwarded-For` header of these proxies only; `compose.yaml` trusts the local HTTPS
endpoint in front of the api. Unset, every request counts as coming from the same device. Never
trust an address from which anyone else can reach the api: they could pose as any device.

Both services answer `GET /health` with `200` when they can reach the database, `503` otherwise.

## Web app

With `WEB_DIRECTORY` set, the api serves the web app on every address outside `/api` and `/health`,
under a strict Content Security Policy. The app installs as a PWA (home screen on a phone, app
window on a computer) and opens offline; browsers only allow this over HTTPS, so put the api behind
an HTTPS endpoint such as `tailscale serve`. A new version applies the next time the app is opened.

## Docker images

One `Dockerfile` builds both services. CI publishes them on every change to `main` and on every
version tag. To try a change locally, `compose.build.yaml` builds them from the sources:

```bash
docker compose --file compose.yaml --file compose.build.yaml up --build
```

The api image also serves the web app. The worker image includes `pg_dump` 18 for the backups. Both
run as the unprivileged `node` user (uid 1000): the backup folder mounted into the worker must be
writable by that user.

## Mac app

The Mac app (macOS 13.3 or later) carries the web app inside itself. It is not signed yet: open it
the first time with right-click, then Open.

Building it needs Rust through rustup (the version, pinned in
`apps/desktop/src-tauri/rust-toolchain.toml`, installs itself on first use) and the Xcode command
line tools. `pnpm desktop:build` produces
`apps/desktop/src-tauri/target/release/bundle/macos/MailBox.app`, to copy into Applications.

## Backups

Every night at 3 a.m. (in the `TZ` time zone), the worker dumps the database into
`BACKUP_DIRECTORY` as `mailbox-<UTC date>.dump` (PostgreSQL custom format, compressed, readable by
its owner only). The 7 most recent backups are kept; older ones are deleted only after a new backup
succeeds. A night missed while the machine was off is caught up once at the next start.

Keep this folder on a disk that is itself backed up: a copy on the same disk does not survive the
disk. Mails stay on Gmail and Outlook either way; a backup spares a full resynchronisation and keeps
what only exists locally (settings, account connections, AI results already paid for).

To restore, stop the api and the worker, then run `pg_restore` 18 or later:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" /path/to/mailbox-20261024T010000Z.dump
```

## Development

Requirements: Node.js 26 (version pinned in `.nvmrc`), pnpm 12, Docker, and the PostgreSQL 18
client tools (`pg_dump`, `pg_restore`; on macOS: `brew install libpq`).

```bash
nvm use
pnpm install
pnpm --filter @mailbox/ui exec playwright install --only-shell chromium
pnpm dev
```

The third command downloads the Chromium in which the interface components are tested; run it
again after an upgrade of Playwright.

`pnpm dev` starts a local PostgreSQL in Docker (port `5433`, see `compose.dev.yaml`), then with live
reload the web app on `http://localhost:5173`, the api on `http://127.0.0.1:3000` and the worker
(health check on port `3001`). Local backups land in `.backups/`. Development and test settings
live in `.env.development` and `.env.test`; they only hold local values.

`http://localhost:5173/design.html` shows every design token and interface component in both
themes. It exists in development only.

| Command              | Purpose                                                                               |
| -------------------- | ------------------------------------------------------------------------------------- |
| `pnpm dev`           | Start the local database and every service in watch mode                              |
| `pnpm build`         | Build every package, the Mac app excepted                                             |
| `pnpm typecheck`     | Type-check every package                                                              |
| `pnpm lint`          | Lint and check formatting (Biome)                                                     |
| `pnpm lint:fix`      | Apply formatting and safe lint fixes                                                  |
| `pnpm test`          | Start the local database, then run the unit, integration and component tests (Vitest) |
| `pnpm db:generate`   | Write a migration from the Drizzle schema (`packages/db/src/schema`)                  |
| `pnpm db:migrate`    | Apply the migrations to the local database                                            |
| `pnpm db:start`      | Start the local database only                                                         |
| `pnpm desktop:dev`   | Start the Mac app on the development web app, with live reload                        |
| `pnpm desktop:build` | Build the Mac app                                                                     |

## License

[GNU Affero General Public License v3.0](LICENSE).
