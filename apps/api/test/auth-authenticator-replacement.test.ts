import type { Database } from '@mailbox/db';
import { totpEnrollmentSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authStatusOf, callAuth, errorCode, sessionCookieFrom } from './auth-requests.ts';
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
/** Cookie of a session opened with a recovery code. */
let recoveryCookie: string;

function getMailboxes(cookie: string) {
  return fetch(`${api.url}/api/mailboxes`, { headers: { cookie } });
}

async function replaceAuthenticator(cookie: string) {
  const enrollment = await callAuth(api, 'POST', '/totp/secret', { cookie });
  const { secret } = totpEnrollmentSchema.parse(await enrollment.json());
  return callAuth(api, 'PUT', '/totp', {
    cookie,
    body: { totpSecret: secret, totpCode: totpCode(secret) },
  });
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
  const signIn = await callAuth(api, 'POST', '/login', {
    body: {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      secondFactor: { kind: 'recoveryCode', code: testAccount.recoveryCodes[0] },
    },
  });
  recoveryCookie = sessionCookieFrom(signIn);
});

describe('a session opened with a recovery code', () => {
  it('says the authenticator app must be replaced, with the recovery codes left', async () => {
    expect((await authStatusOf(api, recoveryCookie)).status).toEqual({
      state: 'authenticatorReplacementRequired',
      recoveryCodesLeft: 9,
    });
  });

  it('reaches nothing but the replacement, until a new app is set up', async () => {
    const refused = await getMailboxes(recoveryCookie);
    expect(refused.status).toBe(403);
    expect(await errorCode(refused)).toBe('AUTHENTICATOR_REPLACEMENT_REQUIRED');

    expect((await replaceAuthenticator(recoveryCookie)).status).toBe(204);

    expect((await getMailboxes(recoveryCookie)).status).toBe(200);
    expect((await authStatusOf(api, recoveryCookie)).status).toEqual({
      state: 'signedIn',
      username: TEST_USERNAME,
    });
  });

  it('leaves the other sessions, opened with the authenticator app, as they were', async () => {
    expect((await getMailboxes(testAccount.setupCookie)).status).toBe(200);
  });
});
