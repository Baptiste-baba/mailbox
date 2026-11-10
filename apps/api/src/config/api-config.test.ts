import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseApiConfig } from './api-config.ts';

const databaseUrl = 'postgres://mailbox:secret@localhost:5432/mailbox';
const secretKey = Buffer.alloc(32, 7);
const required = {
  DATABASE_URL: databaseUrl,
  MAILBOX_SECRET_KEY: secretKey.toString('base64'),
  MAILBOX_URL: 'https://mail.example.ts.net',
};

function without(name: string): Record<string, string> {
  return Object.fromEntries(Object.entries(required).filter(([key]) => key !== name));
}

const invalidEnvironments: [string, Record<string, string>][] = [
  ['a missing database URL', without('DATABASE_URL')],
  ['a non-Postgres database URL', { ...required, DATABASE_URL: 'mysql://localhost/mailbox' }],
  ['a missing secret key', without('MAILBOX_SECRET_KEY')],
  ['a secret key that is not base64', { ...required, MAILBOX_SECRET_KEY: 'not base64!' }],
  ['a secret key shorter than 32 bytes', { ...required, MAILBOX_SECRET_KEY: 'c2hvcnQ=' }],
  ['a port out of range', { ...required, API_PORT: '70000' }],
  ['an unknown log level', { ...required, LOG_LEVEL: 'verbose' }],
  ['a web folder without index.html', { ...required, WEB_DIRECTORY: tmpdir() }],
  ['a trusted proxy that is not an address', { ...required, TRUSTED_PROXIES: 'localhost' }],
  ['a trusted subnet with a wrong prefix', { ...required, TRUSTED_PROXIES: '10.0.0.0/33' }],
  ['a missing app address', without('MAILBOX_URL')],
  ['an app address without a scheme', { ...required, MAILBOX_URL: 'mail.example.ts.net' }],
  ['an app address over http', { ...required, MAILBOX_URL: 'http://mail.example.ts.net' }],
  ['an app address on an IPv4 address', { ...required, MAILBOX_URL: 'https://192.168.1.20' }],
  ['an app address on an IPv6 address', { ...required, MAILBOX_URL: 'https://[fd00::1]' }],
  ['an app address with a path', { ...required, MAILBOX_URL: 'https://mail.example.ts.net/app' }],
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
      appUrl: { origin: 'https://mail.example.ts.net', rpId: 'mail.example.ts.net' },
      host: '127.0.0.1',
      port: 3000,
      webDirectory: undefined,
      logLevel: 'info',
      trustedProxies: [],
    });
  });

  it('reads the port from its string form', () => {
    const result = parseApiConfig({ ...required, API_PORT: '8080' });

    expect(result.data?.port).toBe(8080);
  });

  it('reads the trusted proxies as a list of addresses, subnets and range names', () => {
    const result = parseApiConfig({
      ...required,
      TRUSTED_PROXIES: 'loopback, 172.16.0.0/12,fd00::1',
    });

    expect(result.data?.trustedProxies).toEqual(['loopback', '172.16.0.0/12', 'fd00::1']);
  });

  it('accepts a folder holding the built web app', () => {
    const result = parseApiConfig({ ...required, WEB_DIRECTORY: webDirectory });

    expect(result.data?.webDirectory).toBe(webDirectory);
  });
});

describe('parseApiConfig, address of the app', () => {
  it('reads the origin of the app and the host name passkeys belong to', () => {
    const result = parseApiConfig({
      ...required,
      MAILBOX_URL: 'https://Mail.Example.ts.net:8443/',
    });

    expect(result.data?.appUrl).toEqual({
      origin: 'https://mail.example.ts.net:8443',
      rpId: 'mail.example.ts.net',
    });
  });

  it('accepts http on localhost, for development', () => {
    const result = parseApiConfig({ ...required, MAILBOX_URL: 'http://localhost:5173' });

    expect(result.data?.appUrl).toEqual({ origin: 'http://localhost:5173', rpId: 'localhost' });
  });
});

describe('parseApiConfig, invalid environments', () => {
  it.each(invalidEnvironments)('refuses %s', (_case, environment) => {
    expect(parseApiConfig(environment).success).toBe(false);
  });
});
