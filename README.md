# MailBox

Self-hosted, AI-first email client for Gmail and Outlook. One instance serves one user.

> Under construction: not usable yet.

## Configuration

Services read their configuration from environment variables, validated at startup: a missing or
invalid variable stops the service with an explicit message. `.env.example` lists every variable.

| Variable       | Required | Default     | Purpose                                                        |
| -------------- | -------- | ----------- | -------------------------------------------------------------- |
| `DATABASE_URL` | yes      |             | PostgreSQL connection string (`postgres://…`)                  |
| `API_HOST`     | no       | `127.0.0.1` | Address the api listens on (`0.0.0.0` inside a container)      |
| `API_PORT`     | no       | `3000`      | Port the api listens on                                        |
| `LOG_LEVEL`    | no       | `info`      | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |

The api answers `GET /health` with `200` when it can reach the database, `503` otherwise.

## Development

Requirements: Node.js 26 (version pinned in `.nvmrc`), pnpm 12 and Docker.

```bash
nvm use
pnpm install
pnpm dev
```

`pnpm dev` starts a local PostgreSQL in Docker (port `5433`, see `compose.dev.yaml`), then the api
on `http://127.0.0.1:3000` with live reload. Development and test settings live in
`.env.development` and `.env.test`; they only hold local values.

| Command          | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm dev`       | Start the local database and every service in watch mode               |
| `pnpm build`     | Build every package                                                    |
| `pnpm typecheck` | Type-check every package                                               |
| `pnpm lint`      | Lint and check formatting (Biome)                                      |
| `pnpm lint:fix`  | Apply formatting and safe lint fixes                                   |
| `pnpm test`      | Start the local database, then run unit and integration tests (Vitest) |
| `pnpm db:start`  | Start the local database only                                          |
