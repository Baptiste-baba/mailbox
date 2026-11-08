import { Injectable } from '@nestjs/common';

export type AttemptKind = 'setup' | 'password' | 'second_factor';

/** Slows down whoever keeps failing: each failure lengthens the wait before the next try. */
@Injectable()
export class AttemptThrottleService {
  /** @throws AppError TOO_MANY_ATTEMPTS while the wait after the last failures is running. */
  ensureAllowed(_kind: AttemptKind): Promise<void> {
    throw new Error('Not implemented yet');
  }

  recordFailure(_kind: AttemptKind): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
