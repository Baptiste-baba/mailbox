import { describe, expect, it } from 'vitest';
import { parseApiConfig } from './api-config.ts';

const databaseUrl = 'postgres://mailbox:secret@localhost:5432/mailbox';

describe('parseApiConfig', () => {
  it('applies defaults when only the database is configured', () => {
    const result = parseApiConfig({ DATABASE_URL: databaseUrl });

    expect(result.data).toEqual({
      databaseUrl,
      host: '127.0.0.1',
      port: 3000,
      logLevel: 'info',
    });
  });

  it('reads the port from its string form', () => {
    const result = parseApiConfig({ DATABASE_URL: databaseUrl, API_PORT: '8080' });

    expect(result.data?.port).toBe(8080);
  });

  it.each([
    ['a missing database URL', {}],
    ['a non-Postgres database URL', { DATABASE_URL: 'mysql://localhost/mailbox' }],
    ['a port out of range', { DATABASE_URL: databaseUrl, API_PORT: '70000' }],
    ['an unknown log level', { DATABASE_URL: databaseUrl, LOG_LEVEL: 'verbose' }],
  ])('refuses %s', (_case, environment) => {
    expect(parseApiConfig(environment).success).toBe(false);
  });
});
