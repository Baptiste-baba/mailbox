import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseWorkerConfig } from './worker-config.ts';

const SECRET_KEY = Buffer.alloc(32, 7);
const required = {
  DATABASE_URL: 'postgres://mailbox:secret@localhost:5432/mailbox',
  MAILBOX_SECRET_KEY: SECRET_KEY.toString('base64'),
  BACKUP_DIRECTORY: '/backups',
};

describe('parseWorkerConfig', () => {
  it('applies defaults when only the required variables are set', () => {
    const result = parseWorkerConfig(required);

    expect(result.data).toEqual({
      databaseUrl: required.DATABASE_URL,
      secretKey: SECRET_KEY,
      backupDirectory: '/backups',
      healthPort: 3001,
      logLevel: 'info',
      google: undefined,
    });
  });
});

describe('parseWorkerConfig, about the Google client', () => {
  it('reads the Google client of the installation, to read Gmail mailboxes', () => {
    const result = parseWorkerConfig({
      ...required,
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
    });

    expect(result.data?.google).toEqual({ clientId: 'client-id', clientSecret: 'client-secret' });
  });

  // Compose hands over a variable left unset in .env as an empty text.
  it('takes empty Google variables for unset ones', () => {
    const result = parseWorkerConfig({
      ...required,
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
    });

    expect(result.data?.google).toBeUndefined();
  });

  it('resolves a relative backup directory against the working directory', () => {
    const result = parseWorkerConfig({ ...required, BACKUP_DIRECTORY: 'backups' });

    expect(result.data?.backupDirectory).toBe(resolve('backups'));
  });
});

describe('parseWorkerConfig, given what it cannot start with', () => {
  it.each([
    ['a missing backup directory', { ...required, BACKUP_DIRECTORY: undefined }],
    ['a missing database URL', { ...required, DATABASE_URL: undefined }],
    ['a missing secret key', { ...required, MAILBOX_SECRET_KEY: undefined }],
    ['a secret key of another length', { ...required, MAILBOX_SECRET_KEY: 'c2hvcnQ=' }],
    ['half a Google client', { ...required, GOOGLE_CLIENT_ID: 'client-id' }],
    ['a health port out of range', { ...required, WORKER_HEALTH_PORT: '0' }],
  ])('refuses %s', (_case, environment) => {
    expect(parseWorkerConfig(environment).success).toBe(false);
  });
});
