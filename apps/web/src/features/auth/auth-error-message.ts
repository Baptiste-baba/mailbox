import type { ErrorCode } from '@mailbox/shared';
import { ApiError } from '../../api/api-error.ts';
import { ServerUnreachableError } from '../../api/server-unreachable-error.ts';
import { fr } from '../../i18n/fr.ts';
import { retryAfterSeconds } from './retry-after-seconds.ts';

function formatWait(seconds: number): string {
  return seconds < 60 ? fr.auth.waitSeconds(seconds) : fr.auth.waitMinutes(Math.ceil(seconds / 60));
}

/**
 * What to tell the user after a failed sign-in or setup request: the messages a screen gives for
 * the errors it expects, else what every such screen says.
 */
export function authErrorMessage(
  error: unknown,
  expected: Partial<Record<ErrorCode, string>> = {},
): string {
  if (error instanceof ServerUnreachableError) {
    return fr.auth.unreachable;
  }
  if (!(error instanceof ApiError)) {
    return fr.auth.unexpected;
  }
  const wait = retryAfterSeconds(error);
  if (wait !== undefined) {
    return fr.auth.tooManyAttempts(formatWait(wait));
  }
  return expected[error.code] ?? fr.auth.unexpected;
}
