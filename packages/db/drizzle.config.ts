import { defineConfig } from 'drizzle-kit';

// `db:generate` writes a migration from the schema; the api applies migrations when it starts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
