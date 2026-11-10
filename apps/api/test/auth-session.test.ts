import { type Database, session } from '@mailbox/db';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authStatusOf, callAuth, sessionCookieFrom, sessionSetCookie } from './auth-requests.ts';
import { totpCode } from './authenticator-app.ts';
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

    const { response, status } = await authStatusOf(api, testAccount.setupCookie);

    expect(status).toEqual({ state: 'signedIn', username: TEST_USERNAME });
    const expires = /Expires=([^;]+)/.exec(sessionSetCookie(response) ?? '')?.[1] ?? '';
    expect(new Date(expires).getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1_000);
  });

  it('says nobody is signed in without a session', async () => {
    const { response, status } = await authStatusOf(api);

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

    const { response, status } = await authStatusOf(api, testAccount.setupCookie);

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
    expect((await authStatusOf(api, testAccount.setupCookie)).status).toEqual({
      state: 'signedOut',
    });
    expect((await authStatusOf(api, sessionCookieFrom(otherDevice))).status.state).toBe('signedIn');
  });
});
