import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseWorkerConfig } from './worker-config.ts';

const required = {
  DATABASE_URL: 'postgres://mailbox:secret@localhost:5432/mailbox',
  BACKUP_DIRECTORY: '/backups',
};

describe('parseWorkerConfig', () => {
  it('applies defaults when only the required variables are set', () => {
    const result = parseWorkerConfig(required);

    expect(result.data).toEqual({
      databaseUrl: required.DATABASE_URL,
      backupDirectory: '/backups',
      healthPort: 3001,
      logLevel: 'info',
    });
  });

  it('resolves a relative backup directory against the working directory', () => {
    const result = parseWorkerConfig({ ...required, BACKUP_DIRECTORY: 'backups' });

    expect(result.data?.backupDirectory).toBe(resolve('backups'));
  });

  it.each([
    ['a missing backup directory', { DATABASE_URL: required.DATABASE_URL }],
    ['a missing database URL', { BACKUP_DIRECTORY: '/backups' }],
    ['a health port out of range', { ...required, WORKER_HEALTH_PORT: '0' }],
  ])('refuses %s', (_case, environment) => {
    expect(parseWorkerConfig(environment).success).toBe(false);
  });
});
