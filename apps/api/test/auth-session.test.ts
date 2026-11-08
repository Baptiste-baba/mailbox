import { type Database, session } from '@mailbox/db';
import { authStatusSchema, totpEnrollmentSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { callAuth, errorCode, sessionCookieFrom, sessionSetCookie } from './auth-requests.ts';
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

async function statusWith(cookie?: string) {
  const response = await callAuth(api, 'GET', '/status', { cookie });
  return { response, status: authStatusSchema.parse(await response.json()) };
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

describe('session', () => {
  it('says who is signed in, and pushes the end of the session back', async () => {
    await database.update(session).set({ expiresAt: new Date(Date.now() + 60_000) });

    const { response, status } = await statusWith(testAccount.setupCookie);

    expect(status).toEqual({ state: 'signedIn', username: TEST_USERNAME });
    const expires = /Expires=([^;]+)/.exec(sessionSetCookie(response) ?? '')?.[1] ?? '';
    expect(new Date(expires).getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1_000);
  });

  it('says nobody is signed in without a session', async () => {
    const { response, status } = await statusWith();

    expect(status).toEqual({ state: 'signedOut' });
    expect(sessionSetCookie(response)).toBeUndefined();
  });

  it.each([
    [
      'an expired session',
      () => database.update(session).set({ expiresAt: new Date(Date.now() - 1_000) }),
    ],
    ['an unknown session', () => database.delete(session)],
  ])('signs out, and clears the cookie, on %s', async (_case, endSession) => {
    await endSession();

    const { response, status } = await statusWith(testAccount.setupCookie);

    expect(status).toEqual({ state: 'signedOut' });
    expect(sessionSetCookie(response)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});

describe('sign-out', () => {
  it('signs out this device only', async () => {
    const otherDevice = await callAuth(api, 'POST', '/login', {
      body: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        secondFactor: { kind: 'totp', code: totpCode(testAccount.totpSecret, 1) },
      },
    });

    const logout = await callAuth(api, 'POST', '/logout', { cookie: testAccount.setupCookie });

    expect(logout.status).toBe(204);
    expect(sessionSetCookie(logout)).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect((await statusWith(testAccount.setupCookie)).status).toEqual({ state: 'signedOut' });
    expect((await statusWith(sessionCookieFrom(otherDevice))).status.state).toBe('signedIn');
  });
});

describe('replacing the authenticator app', () => {
  it('replaces the app at once: codes of the former app stop working', async () => {
    const enrollment = await callAuth(api, 'POST', '/totp/secret', {
      cookie: testAccount.setupCookie,
    });
    const { secret, otpauthUri } = totpEnrollmentSchema.parse(await enrollment.json());
    expect(otpauthUri).toContain('MailBox:alex');

    const replaced = await callAuth(api, 'PUT', '/totp', {
      cookie: testAccount.setupCookie,
      body: { totpSecret: secret, totpCode: totpCode(secret) },
    });
    expect(replaced.status).toBe(204);

    const withFormerApp = await callAuth(api, 'POST', '/login', {
      body: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD,
        secondFactor: { kind: 'totp', code: totpCode(testAccount.totpSecret, 1) },
      },
    });
    expect(await errorCode(withFormerApp)).toBe('INVALID_SECOND_FACTOR');
  });

  it('keeps the former app when the code does not match the new one', async () => {
    const enrollment = await callAuth(api, 'POST', '/totp/secret', {
      cookie: testAccount.setupCookie,
    });
    const { secret } = totpEnrollmentSchema.parse(await enrollment.json());

    const response = await callAuth(api, 'PUT', '/totp', {
      cookie: testAccount.setupCookie,
      body: { totpSecret: secret, totpCode: wrongTotpCode(secret) },
    });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('INVALID_SECOND_FACTOR');
  });
});
