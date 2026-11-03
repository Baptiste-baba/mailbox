# MailBox

Self-hosted, AI-first email client for Gmail and Outlook. One instance serves one user.

> Under construction: not usable yet.

## Configuration

Services read their configuration from environment variables, validated at startup: a missing or
invalid variable stops the service with an explicit message. `.env.example` lists every variable.

| Variable             | Used by     | Required | Default     | Purpose                                                        |
| -------------------- | ----------- | -------- | ----------- | -------------------------------------------------------------- |
| `DATABASE_URL`       | api, worker | yes      |             | PostgreSQL connection string (`postgres://…`)                  |
| `API_HOST`           | api         | no       | `127.0.0.1` | Address the api listens on (`0.0.0.0` inside a container)      |
| `API_PORT`           | api         | no       | `3000`      | Port the api listens on                                        |
| `WEB_DIRECTORY`      | api         | no       |             | Built web app (`apps/web/dist`) to serve; unset, API only      |
| `BACKUP_DIRECTORY`   | worker      | yes      |             | Folder receiving the nightly database backups                  |
| `WORKER_HEALTH_PORT` | worker      | no       | `3001`      | Port of the worker health check, bound to loopback only        |
| `LOG_LEVEL`          | api, worker | no       | `info`      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `TZ`                 | worker      | no       | `UTC`       | Time zone, e.g. `Europe/Paris`; sets the hour of the backup    |

Both services answer `GET /health` with `200` when they can reach the database, `503` otherwise.

## Web app

With `WEB_DIRECTORY` set, the api serves the web app on every address outside `/api` and `/health`,
under a strict Content Security Policy. The app installs as a PWA (home screen on a phone, app
window on a computer) and opens offline; browsers only allow this over HTTPS, so put the api behind
an HTTPS endpoint such as `tailscale serve`. A new version applies the next time the app is opened.

## Docker images

One `Dockerfile` builds both services:

```bash
docker build --target api --tag mailbox-api .
docker build --target worker --tag mailbox-worker .
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
pnpm dev
```

`pnpm dev` starts a local PostgreSQL in Docker (port `5433`, see `compose.dev.yaml`), then with live
reload the web app on `http://localhost:5173`, the api on `http://127.0.0.1:3000` and the worker
(health check on port `3001`). Local backups land in `.backups/`. Development and test settings
live in `.env.development` and `.env.test`; they only hold local values.

`http://localhost:5173/design.html` shows every design token in both themes. It exists in
development only.

| Command              | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm dev`           | Start the local database and every service in watch mode               |
| `pnpm build`         | Build every package, the Mac app excepted                              |
| `pnpm typecheck`     | Type-check every package                                               |
| `pnpm lint`          | Lint and check formatting (Biome)                                      |
| `pnpm lint:fix`      | Apply formatting and safe lint fixes                                   |
| `pnpm test`          | Start the local database, then run unit and integration tests (Vitest) |
| `pnpm db:start`      | Start the local database only                                          |
| `pnpm desktop:dev`   | Start the Mac app on the development web app, with live reload         |
| `pnpm desktop:build` | Build the Mac app                                                      |

## License

[GNU Affero General Public License v3.0](LICENSE).
