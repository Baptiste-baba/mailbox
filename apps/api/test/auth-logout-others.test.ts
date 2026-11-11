import type { Database } from '@mailbox/db';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authStatusOf, callAuth, errorCode } from './auth-requests.ts';
import { totpCode } from './authenticator-app.ts';
import { type RunningApi, startApi } from './start-api.ts';
import { createTestAccount, signInElsewhere, type TestAccount } from './test-account.ts';
import { letIdentityConfirmationAge, openTestDatabase, resetAuthTables } from './test-database.ts';

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

describe('signing out the other devices', () => {
  it('ends every other session, and keeps the one that asked', async () => {
    const elsewhere = await signInElsewhere(api, {
      kind: 'totp',
      code: totpCode(testAccount.totpSecret, 1),
    });

    const response = await callAuth(api, 'POST', '/logout/others', {
      cookie: testAccount.setupCookie,
    });

    expect(response.status).toBe(204);
    expect((await authStatusOf(api, testAccount.setupCookie)).status.state).toBe('signedIn');
    expect((await authStatusOf(api, elsewhere)).status.state).toBe('signedOut');
  });

  it('asks to confirm the identity once the last proof is ten minutes old', async () => {
    const elsewhere = await signInElsewhere(api, {
      kind: 'totp',
      code: totpCode(testAccount.totpSecret, 1),
    });
    await letIdentityConfirmationAge(database);

    const response = await callAuth(api, 'POST', '/logout/others', {
      cookie: testAccount.setupCookie,
    });

    expect(await errorCode(response)).toBe('IDENTITY_CONFIRMATION_REQUIRED');
    expect((await authStatusOf(api, elsewhere)).status.state).toBe('signedIn');
  });

  it('needs a session', async () => {
    const response = await callAuth(api, 'POST', '/logout/others');

    expect(await errorCode(response)).toBe('UNAUTHENTICATED');
  });

  // Such a session sets up a new authenticator app first, which signs out the other devices.
  it('is refused to a session opened with a recovery code', async () => {
    const recovery = await signInElsewhere(api, {
      kind: 'recoveryCode',
      code: testAccount.recoveryCodes[0],
    });

    const response = await callAuth(api, 'POST', '/logout/others', { cookie: recovery });

    expect(await errorCode(response)).toBe('AUTHENTICATOR_REPLACEMENT_REQUIRED');
    expect((await authStatusOf(api, testAccount.setupCookie)).status.state).toBe('signedIn');
  });
});
