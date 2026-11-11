import { type PasskeySummary, passkeyRegistrationSchema } from '@mailbox/shared';
import { apiError, fakeApi, noContent } from './fake-api.ts';
import { testPasskeyCreationOptions, testPasskeyRequestOptions } from './virtual-authenticator.ts';

const confirmationRequired = apiError(403, 'IDENTITY_CONFIRMATION_REQUIRED');

interface SettingsApiOptions {
  /** The passkeys the account has to begin with. */
  passkeys?: PasskeySummary[];
  /** The identity was confirmed too long ago: changes wait for a new confirmation. */
  confirmationExpired?: boolean;
  /** Ids of passkeys the password manager must not replace. */
  excluded?: string[];
}

/**
 * The api of the security settings, keeping the passkeys as the server would: added ones show in
 * the list, removed ones go. Changes, and signing out the other devices, need a confirmed
 * identity, as the server's do.
 */
export function settingsApi({
  passkeys = [],
  confirmationExpired = false,
  excluded = [],
}: SettingsApiOptions = {}) {
  let stored = [...passkeys];
  let confirmed = !confirmationExpired;
  return fakeApi({
    passkeys: () => ({ passkeys: stored }),
    passkeyCreationOptions: () =>
      confirmed ? testPasskeyCreationOptions(excluded) : confirmationRequired(),
    addPasskey: (body) => {
      const { name } = passkeyRegistrationSchema.parse(body);
      const createdAt = new Date().toISOString();
      stored = [...stored, { id: crypto.randomUUID(), name, createdAt, lastUsedAt: null }];
      return noContent();
    },
    removePasskey: (passkeyId) => {
      if (!confirmed) {
        return confirmationRequired();
      }
      stored = stored.filter((passkey) => passkey.id !== passkeyId);
      return noContent();
    },
    identityConfirmationOptions: testPasskeyRequestOptions,
    confirmIdentity: () => {
      confirmed = true;
      return noContent();
    },
    logoutOthers: () => (confirmed ? noContent() : confirmationRequired()),
  });
}
