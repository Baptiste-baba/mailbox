import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Integration tests run against the test database created by compose.dev.yaml.
    env: parseEnv(readFileSync(new URL('.env.test', import.meta.url), 'utf8')),
    projects: ['apps/*', 'packages/*'],
  },
});
