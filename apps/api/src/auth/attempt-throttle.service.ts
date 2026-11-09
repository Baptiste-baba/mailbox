import { authAttempt, type Database } from '@mailbox/db';
import { AppError, type TooManyAttemptsDetails } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gt, lt, max, type SQL } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';

export type AttemptKind = 'setup' | 'password' | 'second_factor';

/** Failures a device may make before any wait: enough for a few typos. */
const FREE_FAILURES_PER_DEVICE = 5;
/**
 * Failures of all devices together before everyone waits. Far looser: it only matters if devices
 * could be faked, through a proxy trusted by mistake, to escape their own wait.
 */
const FREE_FAILURES_OVERALL = 50;
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
   * Runs one try of a sign-in step from a device (its address), after the previous tries ended. A
   * try that throws an AppError failed: it is recorded, and lengthens the wait of that device. A
   * try that succeeds forgets the failures of that device.
   * @throws AppError TOO_MANY_ATTEMPTS while a wait runs, with the seconds left in its details.
   */
  attempt<T>(kind: AttemptKind, client: string, tryOnce: () => Promise<T>): Promise<T> {
    const result = this.queue.then(() => this.runAttempt(kind, client, tryOnce));
    // The queue only orders the tries: each caller still receives its own result or failure.
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async runAttempt<T>(
    kind: AttemptKind,
    client: string,
    tryOnce: () => Promise<T>,
  ): Promise<T> {
    await this.ensureAllowed(kind, client);
    try {
      const result = await tryOnce();
      await this.database
        .delete(authAttempt)
        .where(and(eq(authAttempt.kind, kind), eq(authAttempt.client, client)));
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        await this.recordFailure(kind, client);
      }
      throw error;
    }
  }

  private async ensureAllowed(kind: AttemptKind, client: string): Promise<void> {
    const ofKind = eq(authAttempt.kind, kind);
    const waits = await Promise.all([
      this.waitLeft(and(ofKind, eq(authAttempt.client, client)), FREE_FAILURES_PER_DEVICE),
      this.waitLeft(ofKind, FREE_FAILURES_OVERALL),
    ]);
    const waitLeft = Math.max(...waits);
    if (waitLeft > 0) {
      const details: TooManyAttemptsDetails = { retryAfterSeconds: Math.ceil(waitLeft / 1_000) };
      throw new AppError('TOO_MANY_ATTEMPTS', 'Too many failed attempts', { details });
    }
  }

  /** Milliseconds before the failures matching `filter` allow a new try; 0 or less when allowed. */
  private async waitLeft(filter: SQL | undefined, freeFailures: number): Promise<number> {
    const [failures] = await this.database
      .select({ count: count(), last: max(authAttempt.attemptedAt) })
      .from(authAttempt)
      .where(and(filter, gt(authAttempt.attemptedAt, this.memoryStart())));
    if (failures === undefined || failures.last === null || failures.count < freeFailures) {
      return 0;
    }
    const wait = Math.min(FIRST_WAIT_MS * 2 ** (failures.count - freeFailures), MAX_WAIT_MS);
    return failures.last.getTime() + wait - Date.now();
  }

  private async recordFailure(kind: AttemptKind, client: string): Promise<void> {
    await this.database.insert(authAttempt).values({ kind, client, attemptedAt: new Date() });
    await this.database.delete(authAttempt).where(lt(authAttempt.attemptedAt, this.memoryStart()));
  }

  private memoryStart(): Date {
    return new Date(Date.now() - FAILURE_MEMORY_MS);
  }
}
