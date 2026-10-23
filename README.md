# MailBox

Self-hosted, AI-first email client for Gmail and Outlook. One instance serves one user.

> Under construction: not usable yet.

## Development

Requirements: Node.js 26 (version pinned in `.nvmrc`) and pnpm 12.

```bash
nvm use
pnpm install
```

| Command          | Purpose                              |
| ---------------- | ------------------------------------ |
| `pnpm build`     | Build every package                  |
| `pnpm typecheck` | Type-check every package             |
| `pnpm lint`      | Lint and check formatting (Biome)    |
| `pnpm lint:fix`  | Apply formatting and safe lint fixes |
| `pnpm test`      | Run unit tests (Vitest)              |
