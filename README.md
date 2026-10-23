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
| `BACKUP_DIRECTORY`   | worker      | yes      |             | Folder receiving the nightly database backups                  |
| `WORKER_HEALTH_PORT` | worker      | no       | `3001`      | Port of the worker health check, bound to loopback only        |
| `LOG_LEVEL`          | api, worker | no       | `info`      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `TZ`                 | worker      | no       | `UTC`       | Time zone, e.g. `Europe/Paris`; sets the hour of the backup    |

Both services answer `GET /health` with `200` when they can reach the database, `503` otherwise.

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

| Command          | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm dev`       | Start the local database and every service in watch mode               |
| `pnpm build`     | Build every package                                                    |
| `pnpm typecheck` | Type-check every package                                               |
| `pnpm lint`      | Lint and check formatting (Biome)                                      |
| `pnpm lint:fix`  | Apply formatting and safe lint fixes                                   |
| `pnpm test`      | Start the local database, then run unit and integration tests (Vitest) |
| `pnpm db:start`  | Start the local database only                                          |

## License

[GNU Affero General Public License v3.0](LICENSE).
