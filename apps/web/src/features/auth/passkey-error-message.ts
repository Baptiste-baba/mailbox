import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';

/**
 * What to tell the user after a passkey failed, if anything: closing the browser's window is their
 * own choice, which needs no word.
 */
export function passkeyErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof DOMException)) {
    return authErrorMessage(error, { INVALID_PASSKEY: fr.passkey.rejected });
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
