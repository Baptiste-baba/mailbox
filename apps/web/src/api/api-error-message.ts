import type { ErrorCode } from '@mailbox/shared';
import { fr } from '../i18n/fr.ts';
import { ApiError } from './api-error.ts';
import { ServerUnreachableError } from './server-unreachable-error.ts';

/**
 * What to tell the user after a request to the api failed: the messages a screen gives for the
 * errors it expects, else what every screen says.
 */
export function apiErrorMessage(
  error: unknown,
  expected: Partial<Record<ErrorCode, string>> = {},
): string {
  if (error instanceof ServerUnreachableError) {
    return fr.common.serverUnreachable;
  }
  if (!(error instanceof ApiError)) {
    return fr.common.serverProblem;
  }
  return expected[error.code] ?? fr.common.serverProblem;
}
