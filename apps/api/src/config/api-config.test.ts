import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseApiConfig } from './api-config.ts';

const databaseUrl = 'postgres://mailbox:secret@localhost:5432/mailbox';

describe('parseApiConfig', () => {
  let webDirectory: string;

  beforeAll(async () => {
    webDirectory = await mkdtemp(join(tmpdir(), 'mailbox-web-'));
    await writeFile(join(webDirectory, 'index.html'), '<!doctype html>');
  });

  afterAll(async () => {
    await rm(webDirectory, { recursive: true, force: true });
  });

  it('applies defaults when only the database is configured', () => {
    const result = parseApiConfig({ DATABASE_URL: databaseUrl });

    expect(result.data).toEqual({
      databaseUrl,
      host: '127.0.0.1',
      port: 3000,
      webDirectory: undefined,
      logLevel: 'info',
    });
  });

  it('reads the port from its string form', () => {
    const result = parseApiConfig({ DATABASE_URL: databaseUrl, API_PORT: '8080' });

    expect(result.data?.port).toBe(8080);
  });

  it('accepts a folder holding the built web app', () => {
    const result = parseApiConfig({ DATABASE_URL: databaseUrl, WEB_DIRECTORY: webDirectory });

    expect(result.data?.webDirectory).toBe(webDirectory);
  });

  it.each([
    ['a missing database URL', {}],
    ['a non-Postgres database URL', { DATABASE_URL: 'mysql://localhost/mailbox' }],
    ['a port out of range', { DATABASE_URL: databaseUrl, API_PORT: '70000' }],
    ['an unknown log level', { DATABASE_URL: databaseUrl, LOG_LEVEL: 'verbose' }],
    ['a web folder without index.html', { DATABASE_URL: databaseUrl, WEB_DIRECTORY: tmpdir() }],
  ])('refuses %s', (_case, environment) => {
    expect(parseApiConfig(environment).success).toBe(false);
  });
});
