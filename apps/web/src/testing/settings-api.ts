import { type PasskeySummary, passkeyRegistrationSchema } from '@mailbox/shared';
import { apiError, fakeApi } from './fake-api.ts';
import { testPasskeyCreationOptions, testPasskeyRequestOptions } from './virtual-authenticator.ts';

const done = () => new Response(null, { status: 204 });
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
 * the list, removed ones go. Changes need a confirmed identity, as the server's do.
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
      return done();
    },
    removePasskey: (passkeyId) => {
      if (!confirmed) {
        return confirmationRequired();
      }
      stored = stored.filter((passkey) => passkey.id !== passkeyId);
      return done();
    },
    identityConfirmationOptions: testPasskeyRequestOptions,
    confirmIdentity: () => {
      confirmed = true;
      return done();
    },
  });
}

/** What the app last sent to `path` in a request with a body, as it was parsed. */
export function lastBodySentTo(fetchMock: ReturnType<typeof fakeApi>, path: string): unknown {
  const sent = fetchMock.mock.calls.findLast(
    ([url, init]) => url === path && init?.body !== undefined,
  )?.[1]?.body;
  return sent === undefined ? undefined : JSON.parse(String(sent));
}
