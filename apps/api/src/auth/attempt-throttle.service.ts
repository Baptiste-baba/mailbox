import { authAttempt, type Database } from '@mailbox/db';
import { AppError, type TooManyAttemptsDetails } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gt, lt, max } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';

export type AttemptKind = 'setup' | 'password' | 'second_factor';

/** Failures allowed before any wait: enough for a few typos. */
const FREE_FAILURES = 5;
/** Wait after the first failure past the free ones, doubled by each further failure. */
const FIRST_WAIT_MS = 1_000;
/** The wait never grows beyond this: the account is slowed down, never locked out. */
const MAX_WAIT_MS = 15 * 60 * 1_000;
/** Failures older than this no longer count, and are deleted. */
const FAILURE_MEMORY_MS = 24 * 60 * 60 * 1_000;

/** Slows down whoever keeps failing: past a few failures, each one lengthens the wait. */
@Injectable()
export class AttemptThrottleService {
  // One api process serves the instance: queuing tries here makes a burst of parallel guesses
  // count one by one, instead of all slipping in before the first failure is recorded.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /**
   * Runs one try of a sign-in step, after the previous tries ended. A try that throws an AppError
   * failed: it is recorded, and lengthens the wait.
   * @throws AppError TOO_MANY_ATTEMPTS while the wait runs, with the seconds left in its details.
   */
  attempt<T>(kind: AttemptKind, tryOnce: () => Promise<T>): Promise<T> {
    const result = this.queue.then(() => this.runAttempt(kind, tryOnce));
    // The queue only orders the tries: each caller still receives its own result or failure.
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async runAttempt<T>(kind: AttemptKind, tryOnce: () => Promise<T>): Promise<T> {
    await this.ensureAllowed(kind);
    try {
      return await tryOnce();
    } catch (error) {
      if (error instanceof AppError) {
        await this.recordFailure(kind);
      }
      throw error;
    }
  }

  private async ensureAllowed(kind: AttemptKind): Promise<void> {
    const [failures] = await this.database
      .select({ count: count(), last: max(authAttempt.attemptedAt) })
      .from(authAttempt)
      .where(and(eq(authAttempt.kind, kind), gt(authAttempt.attemptedAt, this.memoryStart())));
    if (failures === undefined || failures.last === null || failures.count < FREE_FAILURES) {
      return;
    }
    const wait = Math.min(FIRST_WAIT_MS * 2 ** (failures.count - FREE_FAILURES), MAX_WAIT_MS);
    const waitLeft = failures.last.getTime() + wait - Date.now();
    if (waitLeft > 0) {
      const details: TooManyAttemptsDetails = { retryAfterSeconds: Math.ceil(waitLeft / 1_000) };
      throw new AppError('TOO_MANY_ATTEMPTS', 'Too many failed attempts', { details });
    }
  }

  private async recordFailure(kind: AttemptKind): Promise<void> {
    await this.database.insert(authAttempt).values({ kind, attemptedAt: new Date() });
    await this.database.delete(authAttempt).where(lt(authAttempt.attemptedAt, this.memoryStart()));
  }

  private memoryStart(): Date {
    return new Date(Date.now() - FAILURE_MEMORY_MS);
  }
}
