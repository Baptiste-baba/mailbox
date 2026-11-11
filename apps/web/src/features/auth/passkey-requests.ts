import {
  type IdentityConfirmation,
  type PasskeyRegistration,
  passkeyCreationOptionsSchema,
  passkeyRequestOptionsSchema,
} from '@mailbox/shared';
import { postApi, sendApi } from '../../api/fetch-api.ts';

/** A challenge of the api, for the passkey a password manager is about to create. */
export function startPasskeyCreation() {
  return postApi('/auth/passkeys/options', undefined, passkeyCreationOptionsSchema);
}

/** Keeps the passkey the browser created, under the name the user gave it. */
export function addPasskey(registration: PasskeyRegistration) {
  return sendApi('POST', '/auth/passkeys', registration);
}

export function removePasskey(passkeyId: string) {
  return sendApi('DELETE', `/auth/passkeys/${encodeURIComponent(passkeyId)}`, undefined);
}

/** A challenge of the api, for a passkey to sign and confirm the identity. */
export function startIdentityConfirmation() {
  return postApi('/auth/identity-confirmation/options', undefined, passkeyRequestOptionsSchema);
}

export function confirmIdentity(confirmation: IdentityConfirmation) {
  return sendApi('POST', '/auth/identity-confirmation', confirmation);
}
