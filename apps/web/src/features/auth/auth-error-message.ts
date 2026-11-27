import type { ErrorCode } from '@mailbox/shared';
import { ApiError } from '../../api/api-error.ts';
import { apiErrorMessage } from '../../api/api-error-message.ts';
import { fr } from '../../i18n/fr.ts';
import { retryAfterSeconds } from './retry-after-seconds.ts';

function formatWait(seconds: number): string {
  return seconds < 60 ? fr.auth.waitSeconds(seconds) : fr.auth.waitMinutes(Math.ceil(seconds / 60));
}

/**
 * What to tell the user after a failed sign-in or setup request: how long to wait after too many
 * attempts, else what any failed request says.
 */
export function authErrorMessage(
  error: unknown,
  expected: Partial<Record<ErrorCode, string>> = {},
): string {
  const wait = error instanceof ApiError ? retryAfterSeconds(error) : undefined;
  return wait === undefined
    ? apiErrorMessage(error, expected)
    : fr.auth.tooManyAttempts(formatWait(wait));
}
