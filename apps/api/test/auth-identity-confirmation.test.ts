import { account, type Database, passkey, session } from '@mailbox/db';
import { passkeyRequestOptionsSchema, totpEnrollmentSchema } from '@mailbox/shared';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { callAuth, errorCode, sessionCookieFrom } from './auth-requests.ts';
import { totpCode, wrongTotpCode } from './authenticator-app.ts';
import { createTestPasskey, signChallenge, type TestPasskey } from './passkey-authenticator.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { createTestAccount, TEST_PASSWORD, TEST_USERNAME } from './test-account.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

let api: RunningApi;
let database: Database;
let cookie: string;
let totpSecret: string;
let recoveryCodes: string[];
let testPasskey: TestPasskey;

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
  ({ setupCookie: cookie, totpSecret, recoveryCodes } = await createTestAccount(api, database));
  const [owner] = await database.select({ passkeyUserId: account.passkeyUserId }).from(account);
  const userHandle = Buffer.from(owner?.passkeyUserId.replaceAll('-', '') ?? '', 'hex');
  testPasskey = createTestPasskey(userHandle.toString('base64url'));
  await database.insert(passkey).values({
    credentialId: testPasskey.credentialId,
    publicKey: testPasskey.publicKey,
    signCount: 0,
    name: 'iPhone',
  });
});

/** As if the last proof of identity on every device dated from eleven minutes ago. */
async function letConfirmationAge(): Promise<void> {
  await database.update(session).set({ identityConfirmedAt: sql`now() - interval '11 minutes'` });
}

function askToAddPasskey(sessionCookie = cookie): Promise<Response> {
  return callAuth(api, 'POST', '/passkeys/options', { cookie: sessionCookie });
}

function confirm(body: unknown, sessionCookie = cookie): Promise<Response> {
  return callAuth(api, 'POST', '/identity-confirmation', { cookie: sessionCookie, body });
}

async function confirmationChallenge(sessionCookie = cookie): Promise<string> {
  const response = await callAuth(api, 'POST', '/identity-confirmation/options', {
    cookie: sessionCookie,
  });
  return passkeyRequestOptionsSchema.parse(await response.json()).challenge;
}

describe('recent identity confirmation', () => {
  it('counts signing in as a confirmation', async () => {
    expect((await askToAddPasskey()).status).toBe(200);
  });

  it('asks to confirm the identity again ten minutes later', async () => {
    await letConfirmationAge();

    const adding = await askToAddPasskey();
    const removing = await callAuth(api, 'DELETE', `/passkeys/${crypto.randomUUID()}`, { cookie });

    expect(adding.status).toBe(403);
    expect(await errorCode(adding)).toBe('IDENTITY_CONFIRMATION_REQUIRED');
    expect(await errorCode(removing)).toBe('IDENTITY_CONFIRMATION_REQUIRED');
  });

  it('counts a new authenticator app set up after a recovery code as a confirmation', async () => {
    const login = await callAuth(api, 'POST', '/login', {
      body: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        secondFactor: { kind: 'recoveryCode', code: recoveryCodes[0] },
      },
    });
    const recoveryCookie = sessionCookieFrom(login);
    const enrollment = await callAuth(api, 'POST', '/totp/secret', { cookie: recoveryCookie });
    const { secret } = totpEnrollmentSchema.parse(await enrollment.json());

    await callAuth(api, 'PUT', '/totp', {
      cookie: recoveryCookie,
      body: { totpSecret: secret, totpCode: totpCode(secret) },
    });

    expect((await askToAddPasskey(recoveryCookie)).status).toBe(200);
  });
});

describe('confirming the identity', () => {
  beforeEach(letConfirmationAge);

  it('confirms with the password and a code of the authenticator app', async () => {
    const response = await confirm({
      method: 'password',
      password: TEST_PASSWORD,
      totpCode: totpCode(totpSecret, 1),
    });

    expect(response.status).toBe(204);
    expect((await askToAddPasskey()).status).toBe(200);
  });

  it('confirms with a passkey of the account', async () => {
    const challenge = await confirmationChallenge();

    const response = await confirm({
      method: 'passkey',
      response: signChallenge(testPasskey, challenge),
    });

    expect(response.status).toBe(204);
    expect((await askToAddPasskey()).status).toBe(200);
  });

  it('refuses a wrong password, a wrong code, and a code already used', async () => {
    const code = totpCode(totpSecret, 1);
    await confirm({ method: 'password', password: TEST_PASSWORD, totpCode: code });
    await letConfirmationAge();

    const wrongPassword = await confirm({ method: 'password', password: 'guess', totpCode: code });
    const wrongCode = await confirm({
      method: 'password',
      password: TEST_PASSWORD,
      totpCode: wrongTotpCode(totpSecret),
    });
    const usedCode = await confirm({ method: 'password', password: TEST_PASSWORD, totpCode: code });

    expect(await errorCode(wrongPassword)).toBe('INVALID_CREDENTIALS');
    expect(await errorCode(wrongCode)).toBe('INVALID_SECOND_FACTOR');
    expect(await errorCode(usedCode)).toBe('INVALID_SECOND_FACTOR');
    expect((await askToAddPasskey()).status).toBe(403);
  });
});

describe('confirming the identity, refused', () => {
  beforeEach(letConfirmationAge);

  it('slows down a device after five wrong passwords', async () => {
    const tries = [];
    for (let attempt = 0; attempt < 6; attempt++) {
      tries.push(await confirm({ method: 'password', password: 'guess', totpCode: '123456' }));
    }

    expect(await errorCode(tries[4] ?? new Response())).toBe('INVALID_CREDENTIALS');
    expect(await errorCode(tries[5] ?? new Response())).toBe('TOO_MANY_ATTEMPTS');
  });

  it('refuses a passkey challenge given to another session', async () => {
    const login = await callAuth(api, 'POST', '/login', {
      body: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        secondFactor: { kind: 'totp', code: totpCode(totpSecret, 1) },
      },
    });
    const otherCookie = sessionCookieFrom(login);
    const challenge = await confirmationChallenge(otherCookie);

    const response = await confirm({
      method: 'passkey',
      response: signChallenge(testPasskey, challenge),
    });

    expect(await errorCode(response)).toBe('INVALID_PASSKEY');
  });

  it('refuses a passkey challenge given to sign in', async () => {
    const options = await callAuth(api, 'POST', '/passkey-login/options');
    const { challenge } = passkeyRequestOptionsSchema.parse(await options.json());

    const response = await confirm({
      method: 'passkey',
      response: signChallenge(testPasskey, challenge),
    });

    expect(await errorCode(response)).toBe('INVALID_PASSKEY');
  });

  it('refuses a proof it does not know', async () => {
    const response = await confirm({ method: 'email', address: 'alex@example.com' });

    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});
