import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: parseEnv(readFileSync(new URL('../../.env.test', import.meta.url), 'utf8')),
  },
});
