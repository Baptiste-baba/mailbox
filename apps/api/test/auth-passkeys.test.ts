import type { Database } from '@mailbox/db';
import {
  type PasskeyCreationOptions,
  type PasskeyRegistration,
  passkeyCreationOptionsSchema,
  passkeyListSchema,
} from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { callAuth, errorCode, passkeyChallenge } from './auth-requests.ts';
import { totpCode } from './authenticator-app.ts';
import {
  createPasskeyResponse,
  createTestPasskey,
  signChallenge,
  type TestPasskey,
} from './passkey-authenticator.ts';
import { type RunningApi, startApi } from './start-api.ts';
import {
  createTestAccount,
  signInElsewhere,
  storeTestPasskey,
  testUserHandle,
} from './test-account.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

let api: RunningApi;
let database: Database;
let cookie: string;
let totpSecret: string;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  await resetAuthTables(database);
  ({ setupCookie: cookie, totpSecret } = await createTestAccount(api, database));
});

async function creationOptions(sessionCookie = cookie): Promise<PasskeyCreationOptions> {
  const response = await callAuth(api, 'POST', '/passkeys/options', { cookie: sessionCookie });
  return passkeyCreationOptionsSchema.parse(await response.json());
}

function add(name: string, response: PasskeyRegistration['response']): Promise<Response> {
  return callAuth(api, 'POST', '/passkeys', { cookie, body: { name, response } });
}

/** Creates a passkey in a test password manager, then adds it as the web app would. */
async function addNewPasskey(name: string): Promise<{ added: Response; created: TestPasskey }> {
  const created = createTestPasskey(await testUserHandle(database));
  const { challenge } = await creationOptions();
  return { added: await add(name, createPasskeyResponse(created, challenge)), created };
}

async function listPasskeys() {
  const response = await callAuth(api, 'GET', '/passkeys', { cookie });
  return passkeyListSchema.parse(await response.json()).passkeys;
}

async function signInWith(testPasskey: TestPasskey): Promise<Response> {
  const challenge = await passkeyChallenge(api, '/passkey-login/options');
  return callAuth(api, 'POST', '/passkey-login', {
    body: { response: signChallenge(testPasskey, challenge) },
  });
}

describe('adding a passkey', () => {
  it('adds a named passkey, which then signs in', async () => {
    const { added, created } = await addNewPasskey('MacBook');

    expect(added.status).toBe(204);
    expect(await listPasskeys()).toEqual([
      { id: expect.any(String), name: 'MacBook', createdAt: expect.any(String), lastUsedAt: null },
    ]);
    expect((await signInWith(created)).status).toBe(204);
  });

  it('names the passkeys the account has, so that no password manager replaces one', async () => {
    const stored = await storeTestPasskey(database);

    const options = await creationOptions();

    expect(options.excludeCredentials).toEqual([{ id: stored.credentialId, type: 'public-key' }]);
    expect(options.user.id).toBe(await testUserHandle(database));
    expect(options.rp.id).toBe('mail.example');
  });

  it('lists the passkeys oldest first, never with their keys', async () => {
    await addNewPasskey('iPhone');
    await addNewPasskey('MacBook');

    const passkeys = await listPasskeys();

    expect(passkeys.map((passkey) => passkey.name)).toEqual(['iPhone', 'MacBook']);
    expect(Object.keys(passkeys[0] ?? {}).sort()).toEqual([
      'createdAt',
      'id',
      'lastUsedAt',
      'name',
    ]);
  });
});

describe('adding a passkey, refused', () => {
  it('refuses a passkey unlocked without Face ID, Touch ID or a PIN', async () => {
    const created = createTestPasskey(await testUserHandle(database));
    const { challenge } = await creationOptions();

    const added = await add(
      'iPhone',
      createPasskeyResponse(created, challenge, { userVerified: false }),
    );

    expect(await errorCode(added)).toBe('INVALID_PASSKEY');
    expect(await listPasskeys()).toEqual([]);
  });

  it('refuses a passkey created on another site', async () => {
    const created = createTestPasskey(await testUserHandle(database));
    const { challenge } = await creationOptions();

    const added = await add(
      'iPhone',
      createPasskeyResponse(created, challenge, { origin: 'https://mail.example.org' }),
    );

    expect(await errorCode(added)).toBe('INVALID_PASSKEY');
  });

  it('refuses a passkey the account already has', async () => {
    const { created } = await addNewPasskey('iPhone');
    const { challenge } = await creationOptions();

    const again = await add('iPhone again', createPasskeyResponse(created, challenge));

    expect(await errorCode(again)).toBe('INVALID_PASSKEY');
    expect(await listPasskeys()).toHaveLength(1);
  });
});

describe('adding a passkey, refused requests', () => {
  it('refuses a challenge given to another session', async () => {
    const otherCookie = await signInElsewhere(api, { kind: 'totp', code: totpCode(totpSecret, 1) });
    const { challenge } = await creationOptions(otherCookie);
    const created = createTestPasskey(await testUserHandle(database));

    const added = await add('iPhone', createPasskeyResponse(created, challenge));

    expect(await errorCode(added)).toBe('INVALID_PASSKEY');
  });

  it('refuses a passkey without a name', async () => {
    const created = createTestPasskey(await testUserHandle(database));
    const { challenge } = await creationOptions();

    expect(await errorCode(await add('  ', createPasskeyResponse(created, challenge)))).toBe(
      'VALIDATION_FAILED',
    );
  });
});

describe('removing a passkey', () => {
  it('removes a passkey, which signs in no more', async () => {
    const stored = await storeTestPasskey(database);
    const [listed] = await listPasskeys();

    const removal = await callAuth(api, 'DELETE', `/passkeys/${listed?.id}`, { cookie });
    const again = await callAuth(api, 'DELETE', `/passkeys/${listed?.id}`, { cookie });

    expect(removal.status).toBe(204);
    expect(again.status).toBe(204);
    expect(await listPasskeys()).toEqual([]);
    expect(await errorCode(await signInWith(stored))).toBe('INVALID_PASSKEY');
  });

  it('refuses an id that names no passkey', async () => {
    const response = await callAuth(api, 'DELETE', '/passkeys/iphone', { cookie });

    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});

describe('passkey routes, without a session', () => {
  it.each([
    ['GET', '/passkeys'],
    ['POST', '/passkeys/options'],
    ['POST', '/passkeys'],
    ['DELETE', `/passkeys/${crypto.randomUUID()}`],
    ['POST', '/identity-confirmation/options'],
    ['POST', '/identity-confirmation'],
  ])('refuses %s %s', async (method, path) => {
    const response = await callAuth(api, method, path);

    expect(await errorCode(response)).toBe('UNAUTHENTICATED');
  });
});
