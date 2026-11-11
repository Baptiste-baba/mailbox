import type { Database } from '@mailbox/db';
import { totpEnrollmentSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { callAuth, errorCode, passkeyChallenge } from './auth-requests.ts';
import { totpCode, wrongTotpCode } from './authenticator-app.ts';
import { signChallenge, type TestPasskey } from './passkey-authenticator.ts';
import { type RunningApi, startApi } from './start-api.ts';
import {
  createTestAccount,
  signInElsewhere,
  storeTestPasskey,
  TEST_PASSWORD,
} from './test-account.ts';
import { letIdentityConfirmationAge, openTestDatabase, resetAuthTables } from './test-database.ts';

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
  testPasskey = await storeTestPasskey(database);
});

function letConfirmationAge(): Promise<void> {
  return letIdentityConfirmationAge(database);
}

function askToAddPasskey(sessionCookie = cookie): Promise<Response> {
  return callAuth(api, 'POST', '/passkeys/options', { cookie: sessionCookie });
}

function confirm(body: unknown, sessionCookie = cookie): Promise<Response> {
  return callAuth(api, 'POST', '/identity-confirmation', { cookie: sessionCookie, body });
}

function confirmationChallenge(sessionCookie = cookie): Promise<string> {
  return passkeyChallenge(api, '/identity-confirmation/options', sessionCookie);
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
    const recoveryCookie = await signInElsewhere(api, {
      kind: 'recoveryCode',
      code: recoveryCodes[0],
    });
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
    const otherCookie = await signInElsewhere(api, { kind: 'totp', code: totpCode(totpSecret, 1) });
    const challenge = await confirmationChallenge(otherCookie);

    const response = await confirm({
      method: 'passkey',
      response: signChallenge(testPasskey, challenge),
    });

    expect(await errorCode(response)).toBe('INVALID_PASSKEY');
  });

  it('refuses a passkey challenge given to sign in', async () => {
    const challenge = await passkeyChallenge(api, '/passkey-login/options');

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
