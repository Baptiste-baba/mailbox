import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseApiConfig } from './api-config.ts';

const databaseUrl = 'postgres://mailbox:secret@localhost:5432/mailbox';
const secretKey = Buffer.alloc(32, 7);
const required = { DATABASE_URL: databaseUrl, MAILBOX_SECRET_KEY: secretKey.toString('base64') };

const invalidEnvironments: [string, Record<string, string>][] = [
  ['a missing database URL', { MAILBOX_SECRET_KEY: required.MAILBOX_SECRET_KEY }],
  ['a non-Postgres database URL', { ...required, DATABASE_URL: 'mysql://localhost/mailbox' }],
  ['a missing secret key', { DATABASE_URL: databaseUrl }],
  ['a secret key that is not base64', { ...required, MAILBOX_SECRET_KEY: 'not base64!' }],
  ['a secret key shorter than 32 bytes', { ...required, MAILBOX_SECRET_KEY: 'c2hvcnQ=' }],
  ['a port out of range', { ...required, API_PORT: '70000' }],
  ['an unknown log level', { ...required, LOG_LEVEL: 'verbose' }],
  ['a web folder without index.html', { ...required, WEB_DIRECTORY: tmpdir() }],
];

describe('parseApiConfig', () => {
  let webDirectory: string;

  beforeAll(async () => {
    webDirectory = await mkdtemp(join(tmpdir(), 'mailbox-web-'));
    await writeFile(join(webDirectory, 'index.html'), '<!doctype html>');
  });

  afterAll(async () => {
    await rm(webDirectory, { recursive: true, force: true });
  });

  it('applies defaults when only the required variables are set', () => {
    const result = parseApiConfig(required);

    expect(result.data).toEqual({
      databaseUrl,
      secretKey,
      host: '127.0.0.1',
      port: 3000,
      webDirectory: undefined,
      logLevel: 'info',
    });
  });

  it('reads the port from its string form', () => {
    const result = parseApiConfig({ ...required, API_PORT: '8080' });

    expect(result.data?.port).toBe(8080);
  });

  it('accepts a folder holding the built web app', () => {
    const result = parseApiConfig({ ...required, WEB_DIRECTORY: webDirectory });

    expect(result.data?.webDirectory).toBe(webDirectory);
  });

  it.each(invalidEnvironments)('refuses %s', (_case, environment) => {
    expect(parseApiConfig(environment).success).toBe(false);
  });
});
