import { authAttempt, type Database } from '@mailbox/db';
import { AppError } from '@mailbox/shared';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttemptThrottleService } from '../src/auth/attempt-throttle.service.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

let database: Database;
let throttle: AttemptThrottleService;

const LAPTOP = '100.64.0.1';
const PHONE = '100.64.0.2';

const wrongGuess = vi.fn(async (): Promise<string> => {
  throw new AppError('INVALID_CREDENTIALS', 'Wrong password');
});
const rightGuess = vi.fn(async () => 'signed in');

function insertFailures(count: number, attemptedAt: Date, client = LAPTOP) {
  return database.insert(authAttempt).values(
    Array.from({ length: count }, (): typeof authAttempt.$inferInsert => ({
      kind: 'password',
      client,
      attemptedAt,
    })),
  );
}

async function failTimes(count: number, client = LAPTOP) {
  for (let failure = 0; failure < count; failure += 1) {
    await expect(throttle.attempt('password', client, wrongGuess)).rejects.toThrow(
      'Wrong password',
    );
  }
}

function tryFrom(client: string, kind: 'password' | 'setup' = 'password') {
  return throttle.attempt(kind, client, rightGuess);
}

function errorOf(promise: Promise<unknown>) {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

beforeAll(() => {
  database = openTestDatabase();
});

afterAll(async () => {
  await database.$client.end();
});

beforeEach(async () => {
  await resetAuthTables(database);
  throttle = new AttemptThrottleService(database);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-08T10:00:00Z'));
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AttemptThrottleService, waits', () => {
  it('lets five failures through, then makes the next try wait one second', async () => {
    await failTimes(5);

    const error = await errorOf(tryFrom(LAPTOP));
    expect(error).toMatchObject({ code: 'TOO_MANY_ATTEMPTS', details: { retryAfterSeconds: 1 } });
    expect(rightGuess).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    await expect(tryFrom(LAPTOP)).resolves.toBe('signed in');
  });

  it('doubles the wait with each further failure, up to fifteen minutes', async () => {
    await failTimes(5);
    vi.advanceTimersByTime(1_000);
    await failTimes(1);
    expect(await errorOf(tryFrom(LAPTOP))).toMatchObject({
      details: { retryAfterSeconds: 2 },
    });

    await insertFailures(30, new Date());
    expect(await errorOf(tryFrom(LAPTOP))).toMatchObject({
      details: { retryAfterSeconds: 15 * 60 },
    });
  });

  it('forgets the failures of more than a day ago', async () => {
    await insertFailures(30, new Date(Date.now() - 25 * 60 * 60 * 1_000));

    await expect(tryFrom(LAPTOP)).resolves.toBe('signed in');
  });
});

describe('AttemptThrottleService, what counts', () => {
  it('counts neither the tries that succeed nor those that fail on a bug', async () => {
    const bug = async () => {
      throw new Error('connection lost');
    };
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await tryFrom(LAPTOP);
      await expect(throttle.attempt('password', LAPTOP, bug)).rejects.toThrow('connection lost');
    }

    await expect(tryFrom(LAPTOP)).resolves.toBe('signed in');
  });

  it('counts a burst of parallel guesses one by one', async () => {
    const tries = Array.from({ length: 10 }, () =>
      errorOf(throttle.attempt('password', LAPTOP, wrongGuess)),
    );
    const errors = await Promise.all(tries);

    expect(wrongGuess).toHaveBeenCalledTimes(5);
    expect(
      errors.filter((error) => error instanceof AppError && error.code === 'TOO_MANY_ATTEMPTS'),
    ).toHaveLength(5);
  });

  it('forgets the failures once a try succeeds', async () => {
    await failTimes(4);
    await tryFrom(LAPTOP);

    await failTimes(5);
  });
});

describe('AttemptThrottleService, devices and steps', () => {
  it('slows each device on its own', async () => {
    await failTimes(5, PHONE);

    await expect(tryFrom(LAPTOP)).resolves.toBe('signed in');
    expect(await errorOf(tryFrom(PHONE))).toMatchObject({ code: 'TOO_MANY_ATTEMPTS' });
  });

  it('slows every device once all of them together failed fifty times', async () => {
    await insertFailures(49, new Date(), '203.0.113.7');
    await expect(tryFrom(LAPTOP)).resolves.toBe('signed in');

    await failTimes(1, PHONE);

    expect(await errorOf(tryFrom(LAPTOP))).toMatchObject({
      code: 'TOO_MANY_ATTEMPTS',
      details: { retryAfterSeconds: 1 },
    });
  });

  it('slows each kind of step on its own', async () => {
    await failTimes(5);

    await expect(tryFrom(LAPTOP, 'setup')).resolves.toBe('signed in');
  });
});
