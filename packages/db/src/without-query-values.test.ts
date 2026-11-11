import { inspect } from 'node:util';
import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { withoutQueryValues } from './without-query-values.ts';

const STATEMENT = 'insert into "message" ("subject") values ($1)';
const SUBJECT = 'Résultats de ton analyse';

class JobFailure extends Error {
  readonly jobId = 'job-1';
}

function failedInsert(): DrizzleQueryError {
  return new DrizzleQueryError(STATEMENT, [SUBJECT], new Error('connection lost'));
}

/** Everything a logger could reach: message, stack, properties and causes. */
function everythingIn(error: unknown): string {
  return inspect(error, { depth: null, showHidden: true });
}

describe('withoutQueryValues', () => {
  it('drops the values of a failed query and keeps its statement', () => {
    const loggable = withoutQueryValues(failedInsert());

    expect(everythingIn(loggable)).not.toContain(SUBJECT);
    expect(everythingIn(loggable)).toContain(STATEMENT);
  });

  it('keeps where the query failed and why', () => {
    const loggable = withoutQueryValues(failedInsert());

    expect(loggable).toBeInstanceOf(Error);
    expect(everythingIn(loggable)).toContain('without-query-values.test.ts');
    expect(everythingIn(loggable)).toContain('connection lost');
  });

  it('drops the values of a failed query that caused another error', () => {
    const failure = new JobFailure('Synchronisation failed', { cause: failedInsert() });

    const loggable = withoutQueryValues(failure);

    expect(everythingIn(loggable)).not.toContain(SUBJECT);
    expect(everythingIn(loggable)).toContain(STATEMENT);
    expect(loggable).toBeInstanceOf(JobFailure);
    expect(loggable).toMatchObject({ message: 'Synchronisation failed', jobId: 'job-1' });
    expect(loggable).toHaveProperty('stack', failure.stack);
  });

  it('leaves the error it was given untouched', () => {
    const query = failedInsert();
    const failure = new JobFailure('Synchronisation failed', { cause: query });

    withoutQueryValues(failure);

    expect(failure.cause).toBe(query);
    expect(query.params).toEqual([SUBJECT]);
  });

  it('returns an error without a failed query as it is', () => {
    const failure = new JobFailure('Synchronisation failed', { cause: new Error('timeout') });

    expect(withoutQueryValues(failure)).toBe(failure);
  });

  it('returns what is not an error as it is', () => {
    expect(withoutQueryValues('thrown text')).toBe('thrown text');
  });
});
