import { SetMetadata } from '@nestjs/common';

export const OPEN_DURING_AUTHENTICATOR_REPLACEMENT = 'openDuringAuthenticatorReplacement';

/**
 * Lets a route answer a session opened with a recovery code, before a new authenticator app is set
 * up: the replacement itself only.
 */
export const OpenDuringAuthenticatorReplacement = () =>
  SetMetadata(OPEN_DURING_AUTHENTICATOR_REPLACEMENT, true);
