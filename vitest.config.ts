import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Integration tests run against the test database created by compose.dev.yaml.
    env: parseEnv(readFileSync(new URL('.env.test', import.meta.url), 'utf8')),
    // Once before every project: the integration tests run against the current schema.
    globalSetup: ['./apps/api/test/migrate-test-database.ts'],
    projects: ['apps/*', 'packages/*'],
  },
});
