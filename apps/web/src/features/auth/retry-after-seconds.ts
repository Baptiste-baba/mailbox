import { tooManyAttemptsDetailsSchema } from '@mailbox/shared';
import { ApiError } from '../../api/api-error.ts';

/** How long the server asks to wait, when the error is too many failed attempts. */
export function retryAfterSeconds(error: unknown): number | undefined {
  if (!(error instanceof ApiError) || error.code !== 'TOO_MANY_ATTEMPTS') {
    return undefined;
  }
  return tooManyAttemptsDetailsSchema.safeParse(error.details).data?.retryAfterSeconds;
}
