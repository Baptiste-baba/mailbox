import { type Database, session } from '@mailbox/db';
import { errorResponseSchema, loginResponseSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { callAuth, errorCode, sessionSetCookie } from './auth-requests.ts';
import { totpCode, wrongTotpCode } from './authenticator-app.ts';
import { type RunningApi, startApi } from './start-api.ts';
import {
  createTestAccount,
  TEST_PASSWORD,
  TEST_USERNAME,
  type TestAccount,
} from './test-account.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

let api: RunningApi;
let database: Database;
let testAccount: TestAccount;

function logIn(body: object): Promise<Response> {
  return callAuth(api, 'POST', '/login', {
    body: { username: TEST_USERNAME, password: TEST_PASSWORD, ...body },
  });
}

// The setup spent the current code: the next one is the first a sign-in can use.
function withNextCode() {
  return { secondFactor: { kind: 'totp', code: totpCode(testAccount.totpSecret, 1) } };
}

beforeAll(async () => {
  database = openTestDatabase();
  api = await startApi();
});

afterAll(async () => {
  await api.close();
  await database.$client.end();
});

beforeEach(async () => {
  await resetAuthTables(database);
  testAccount = await createTestAccount(api, database);
});

describe('sign-in with the password', () => {
  it.each([
    ['a wrong password', { password: 'correct horse battery stapler' }],
    ['a wrong username', { username: 'sam' }],
  ])('answers 401 INVALID_CREDENTIALS for %s', async (_case, wrong) => {
    const response = await logIn({ ...withNextCode(), ...wrong });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('INVALID_CREDENTIALS');
    expect(sessionSetCookie(response)).toBeUndefined();
  });

  it('asks for the second factor once the password is right, without signing in', async () => {
    const response = await logIn({});

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('SECOND_FACTOR_REQUIRED');
    expect(sessionSetCookie(response)).toBeUndefined();
  });

  it('accepts the username whatever its case, as a phone capitalises it', async () => {
    const response = await logIn({ ...withNextCode(), username: 'Alex' });

    expect(response.status).toBe(200);
  });

  it('makes whoever guesses passwords wait, even once they find the right one', async () => {
    for (let guess = 0; guess < 5; guess += 1) {
      await logIn({ password: 'wrong password' });
    }

    const response = await logIn(withNextCode());

    expect(response.status).toBe(429);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('TOO_MANY_ATTEMPTS');
  });
});

describe('sign-in with the authenticator app', () => {
  it('signs in with a session cookie scripts cannot read, sent to this site only, for 30 days', async () => {
    const response = await logIn(withNextCode());

    expect(response.status).toBe(200);
    expect(loginResponseSchema.parse(await response.json())).toEqual({
      usedRecoveryCode: false,
      recoveryCodesLeft: 10,
    });
    const cookie = sessionSetCookie(response) ?? '';
    expect(cookie).toMatch(/; Path=\/; Expires=.+; HttpOnly; Secure; SameSite=Strict$/);
    const expires = new Date(/Expires=([^;]+)/.exec(cookie)?.[1] ?? '');
    expect(expires.getTime()).toBeCloseTo(Date.now() + 30 * 24 * 60 * 60 * 1_000, -5);
    const token = cookie.split(';')[0]?.split('=')[1] ?? '';
    const storedHashes = (await database.select().from(session)).map((row) => row.tokenHash);
    expect(storedHashes).not.toContain(token);
  });

  it('refuses a code already used', async () => {
    await logIn(withNextCode());

    const again = await logIn(withNextCode());

    expect(again.status).toBe(401);
    expect(await errorCode(again)).toBe('INVALID_SECOND_FACTOR');
  });

  it('refuses a code that is not the app’s', async () => {
    const code = wrongTotpCode(testAccount.totpSecret);
    const response = await logIn({ secondFactor: { kind: 'totp', code } });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('INVALID_SECOND_FACTOR');
  });
});

describe('sign-in with a recovery code', () => {
  it('signs in once with each code, typed in any case', async () => {
    const code = testAccount.recoveryCodes[0] ?? '';
    const recoveryCode = { secondFactor: { kind: 'recoveryCode', code: code.toLowerCase() } };

    const first = await logIn(recoveryCode);
    expect(loginResponseSchema.parse(await first.json())).toEqual({
      usedRecoveryCode: true,
      recoveryCodesLeft: 9,
    });

    const again = await logIn(recoveryCode);
    expect(again.status).toBe(401);
    expect(await errorCode(again)).toBe('INVALID_SECOND_FACTOR');
  });
});
