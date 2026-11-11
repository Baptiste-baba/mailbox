import {
  type LoginRequest,
  type PasskeyLoginRequest,
  passkeyRequestOptionsSchema,
  type TotpConfirmation,
  totpEnrollmentSchema,
} from '@mailbox/shared';
import { postApi, sendApi } from '../../api/fetch-api.ts';

/** Checks the password, then signs in once the request carries the second factor. */
export function logIn(request: LoginRequest) {
  return sendApi('POST', '/auth/login', request);
}

/** A challenge of the api, for a passkey to sign. */
export function startPasskeyLogin() {
  return postApi('/auth/passkey-login/options', undefined, passkeyRequestOptionsSchema);
}

/** Signs in with the passkey that signed the challenge: no username, no password. */
export function logInWithPasskey(request: PasskeyLoginRequest) {
  return sendApi('POST', '/auth/passkey-login', request);
}

/** A new secret for the authenticator app of the signed-in user. */
export function startAuthenticatorReplacement() {
  return postApi('/auth/totp/secret', undefined, totpEnrollmentSchema);
}

/** Replaces the authenticator app, once a code proves the new one holds the secret. */
export function replaceAuthenticator(confirmation: TotpConfirmation) {
  return sendApi('PUT', '/auth/totp', confirmation);
}
