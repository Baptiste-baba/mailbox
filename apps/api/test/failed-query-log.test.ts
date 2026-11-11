import { inspect } from 'node:util';
import { type Database, recoveryCode } from '@mailbox/db';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHttpLoggerOptions } from '../src/logging/logger-options.ts';
import { serializeError } from '../src/logging/serialize-error.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

const STORED_VALUE = 'value-that-must-stay-out-of-the-logs';

let database: Database;

beforeAll(() => {
  database = openTestDatabase();
});

afterAll(async () => {
  await database.$client.end();
});

beforeEach(async () => {
  await resetAuthTables(database);
});

/** The error of a real failed query: Postgres refuses the same recovery code twice. */
async function failedInsert(): Promise<unknown> {
  await database.insert(recoveryCode).values({ codeHash: STORED_VALUE });
  const error: unknown = await database
    .insert(recoveryCode)
    .values({ codeHash: STORED_VALUE })
    .catch((refusal: unknown) => refusal);
  // Without this, the tests below would pass on an error that never carried the value.
  expect(inspect(error, { depth: null })).toContain(STORED_VALUE);
  return error;
}

function collectLogs() {
  const lines: string[] = [];
  return { lines, destination: { write: (line: string) => void lines.push(line) } };
}

describe('logs of a failed query', () => {
  it('leave its values out of the request logs, and keep the statement and the reason', async () => {
    const { lines, destination } = collectLogs();
    const { logger } = pinoHttp(createHttpLoggerOptions('error'), destination);

    logger.error({ err: await failedInsert() }, 'Unhandled exception');

    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain(STORED_VALUE);
    expect(lines[0]).toContain('insert into');
    expect(lines[0]).toContain('recovery_code_code_hash_unique');
  });

  it('leave its values out of the startup logs', async () => {
    const { lines, destination } = collectLogs();
    const logger = pino({ serializers: { err: serializeError } }, destination);

    logger.fatal({ err: await failedInsert() }, 'Startup failed');

    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain(STORED_VALUE);
    expect(lines[0]).toContain('insert into');
  });
});
