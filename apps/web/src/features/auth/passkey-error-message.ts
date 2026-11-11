import type { ErrorCode } from '@mailbox/shared';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';

/**
 * What to tell the user after a passkey failed, if anything: closing the browser's window is their
 * own choice, which needs no word. The api's errors a screen expects besides say what it gives.
 */
export function passkeyErrorMessage(
  error: unknown,
  expected: Partial<Record<ErrorCode, string>> = {},
): string | undefined {
  if (!(error instanceof DOMException)) {
    return authErrorMessage(error, { INVALID_PASSKEY: fr.passkey.rejected, ...expected });
  }
  switch (error.name) {
    case 'NotAllowedError':
    case 'AbortError':
      return undefined;
    // The page is not at the address passkeys belong to, MAILBOX_URL on the server.
    case 'SecurityError':
      return fr.passkey.wrongAddress;
    default:
      return fr.passkey.failed;
  }
}

/** What to tell the user after adding a passkey failed, if anything. */
export function passkeyCreationErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof DOMException)) {
    return authErrorMessage(error, { INVALID_PASSKEY: fr.passkey.addFailed });
  }
  switch (error.name) {
    // The password manager keeps one of the account's passkeys already, and would replace it.
    case 'InvalidStateError':
      return fr.passkey.alreadyThere;
    case 'NotAllowedError':
    case 'AbortError':
    case 'SecurityError':
      return passkeyErrorMessage(error);
    default:
      return fr.passkey.addFailed;
  }
}
