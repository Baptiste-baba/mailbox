import { SetMetadata } from '@nestjs/common';

export const AUTHENTICATOR_REPLACEMENT_ROUTE = 'authenticatorReplacementRoute';

/**
 * Marks the routes that replace the authenticator app. They only answer a session opened with a
 * recovery code, until it sets up the new app, and such a session reaches nothing else: a session
 * left open on a lost device cannot replace the app and lock its owner out.
 */
export const AuthenticatorReplacementRoute = () =>
  SetMetadata(AUTHENTICATOR_REPLACEMENT_ROUTE, true);
