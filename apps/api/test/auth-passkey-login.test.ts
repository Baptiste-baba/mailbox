import { generateKeyPairSync } from 'node:crypto';
import { type Database, passkey } from '@mailbox/db';
import { type PasskeyAuthenticationResponse, passkeyRequestOptionsSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authStatusOf, callAuth, errorCode, sessionCookieFrom } from './auth-requests.ts';
import { createTestPasskey, signChallenge, type TestPasskey } from './passkey-authenticator.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance, storeTestPasskey } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';

let api: RunningApi;
let database: Database;
let testPasskey: TestPasskey;
let cookie: string;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  cookie = await signInOnFreshInstance(api, database);
  testPasskey = await storeTestPasskey(database);
});

async function challengeFor(path: string, sessionCookie?: string): Promise<string> {
  const response = await callAuth(api, 'POST', path, { cookie: sessionCookie });
  return passkeyRequestOptionsSchema.parse(await response.json()).challenge;
}

function signIn(response: PasskeyAuthenticationResponse): Promise<Response> {
  return callAuth(api, 'POST', '/passkey-login', { body: { response } });
}

async function expectRefused(response: Response): Promise<void> {
  expect(response.status).toBe(401);
  expect(response.headers.getSetCookie()).toEqual([]);
  expect(await errorCode(response)).toBe('INVALID_PASSKEY');
}

describe('signing in with a passkey', () => {
  it('signs in with the passkey alone, and records its use', async () => {
    const challenge = await challengeFor('/passkey-login/options');

    const response = await signIn(signChallenge(testPasskey, challenge));

    expect(response.status).toBe(204);
    const { status } = await authStatusOf(api, sessionCookieFrom(response));
    expect(status).toEqual({ state: 'signedIn', username: 'alex' });
    const [stored] = await database.select().from(passkey);
    expect(stored?.lastUsedAt).toBeInstanceOf(Date);
  });

  it('signs in again and again with a synced passkey, whose counter stays at 0', async () => {
    for (const _attempt of [1, 2]) {
      const challenge = await challengeFor('/passkey-login/options');
      const response = await signIn(signChallenge(testPasskey, challenge, { counter: 0 }));
      expect(response.status).toBe(204);
    }
  });

  it('keeps the counter of a passkey that counts, and refuses it going backwards', async () => {
    await database.update(passkey).set({ signCount: 5 });

    const forward = await signIn(
      signChallenge(testPasskey, await challengeFor('/passkey-login/options'), { counter: 6 }),
    );
    const backwards = await signIn(
      signChallenge(testPasskey, await challengeFor('/passkey-login/options'), { counter: 4 }),
    );

    expect(forward.status).toBe(204);
    await expectRefused(backwards);
    const [stored] = await database.select().from(passkey);
    expect(stored?.signCount).toBe(6);
  });
});

describe('signing in with a passkey, refused', () => {
  it('refuses a passkey unlocked without Face ID, Touch ID or a PIN', async () => {
    const challenge = await challengeFor('/passkey-login/options');

    await expectRefused(
      await signIn(signChallenge(testPasskey, challenge, { userVerified: false })),
    );
  });

  it('refuses a signature made on another site', async () => {
    const otherOrigin = signChallenge(testPasskey, await challengeFor('/passkey-login/options'), {
      origin: 'https://mail.example.org',
    });
    const otherParty = signChallenge(testPasskey, await challengeFor('/passkey-login/options'), {
      rpId: 'example.org',
    });

    await expectRefused(await signIn(otherOrigin));
    await expectRefused(await signIn(otherParty));
  });

  it('refuses a signature that does not match the passkey', async () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const challenge = await challengeFor('/passkey-login/options');

    await expectRefused(
      await signIn(signChallenge(testPasskey, challenge, { signingKey: privateKey })),
    );
  });
});

describe('signing in with a passkey, refused passkeys', () => {
  it('refuses a passkey the account does not have', async () => {
    const unknown = createTestPasskey(testPasskey.userHandle);
    const challenge = await challengeFor('/passkey-login/options');

    await expectRefused(await signIn(signChallenge(unknown, challenge)));
  });

  it('refuses a passkey that names another account', async () => {
    const challenge = await challengeFor('/passkey-login/options');
    const response = signChallenge(
      { ...testPasskey, userHandle: Buffer.alloc(16, 7).toString('base64url') },
      challenge,
    );

    await expectRefused(await signIn(response));
  });

  it('refuses an answer that is not a passkey', async () => {
    const challenge = await challengeFor('/passkey-login/options');
    const response = { ...signChallenge(testPasskey, challenge), type: 'password' };

    expect(
      await errorCode(await callAuth(api, 'POST', '/passkey-login', { body: { response } })),
    ).toBe('VALIDATION_FAILED');
  });
});

describe('signing in with a passkey, challenges', () => {
  it('refuses the same signature twice', async () => {
    const response = signChallenge(testPasskey, await challengeFor('/passkey-login/options'));

    expect((await signIn(response)).status).toBe(204);
    await expectRefused(await signIn(response));
  });

  it('refuses a challenge the api never gave', async () => {
    const response = signChallenge(testPasskey, Buffer.alloc(32, 1).toString('base64url'));

    await expectRefused(await signIn(response));
  });

  it('refuses a challenge given to confirm the identity of a session', async () => {
    const challenge = await challengeFor('/identity-confirmation/options', cookie);

    await expectRefused(await signIn(signChallenge(testPasskey, challenge)));
  });
});
