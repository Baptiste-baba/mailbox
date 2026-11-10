import { type Database, passkey } from '@mailbox/db';
import { totpEnrollmentSchema } from '@mailbox/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { authStatusOf, callAuth, errorCode, sessionCookieFrom } from './auth-requests.ts';
import { totpCode, wrongTotpCode } from './authenticator-app.ts';
import { type RunningApi, startApi } from './start-api.ts';
import {
  createTestAccount,
  storeTestPasskey,
  TEST_PASSWORD,
  TEST_USERNAME,
  type TestAccount,
} from './test-account.ts';
import { openTestDatabase, resetAuthTables } from './test-database.ts';

/** A secret of someone else's app, to try the replacement routes with. */
const OTHER_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

let api: RunningApi;
let database: Database;
let testAccount: TestAccount;
/** Cookie of a session opened with a recovery code. */
let recoveryCookie: string;

function getMailboxes(cookie: string) {
  return fetch(`${api.url}/api/mailboxes`, { headers: { cookie } });
}

async function replaceAuthenticator(cookie: string, code = totpCode) {
  const enrollment = await callAuth(api, 'POST', '/totp/secret', { cookie });
  const { secret } = totpEnrollmentSchema.parse(await enrollment.json());
  return callAuth(api, 'PUT', '/totp', {
    cookie,
    body: { totpSecret: secret, totpCode: code(secret) },
  });
}

/** Both replacement routes, tried with a secret of someone else's app. */
async function tryReplacementRoutes(cookie: string | undefined) {
  const enrollment = await callAuth(api, 'POST', '/totp/secret', { cookie });
  const replacement = await callAuth(api, 'PUT', '/totp', {
    cookie,
    body: { totpSecret: OTHER_SECRET, totpCode: totpCode(OTHER_SECRET) },
  });
  return { enrollment, replacement };
}

/** The cookie of a session opened with the recovery code at `index`. */
async function signInWithRecoveryCode(index: number) {
  const signIn = await callAuth(api, 'POST', '/login', {
    body: {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      secondFactor: { kind: 'recoveryCode', code: testAccount.recoveryCodes[index] },
    },
  });
  return sessionCookieFrom(signIn);
}

/** Signs in with a code of the app set up with the account. */
function signInWithFormerApp() {
  return callAuth(api, 'POST', '/login', {
    body: {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      secondFactor: { kind: 'totp', code: totpCode(testAccount.totpSecret, 1) },
    },
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
  recoveryCookie = await signInWithRecoveryCode(0);
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

describe('a new authenticator app', () => {
  it('names the account, and replaces the former app at once', async () => {
    const enrollment = await callAuth(api, 'POST', '/totp/secret', { cookie: recoveryCookie });
    const { secret, otpauthUri } = totpEnrollmentSchema.parse(await enrollment.json());
    expect(otpauthUri).toContain('MailBox:alex');

    const replaced = await callAuth(api, 'PUT', '/totp', {
      cookie: recoveryCookie,
      body: { totpSecret: secret, totpCode: totpCode(secret) },
    });

    expect(replaced.status).toBe(204);
    expect(await errorCode(await signInWithFormerApp())).toBe('INVALID_SECOND_FACTOR');
  });

  // Regression: setting up the app from one session freed every session opened with a recovery code.
  it('ends every other session, whatever opened it', async () => {
    const otherRecoveryCookie = await signInWithRecoveryCode(1);

    expect((await replaceAuthenticator(recoveryCookie)).status).toBe(204);

    expect((await getMailboxes(recoveryCookie)).status).toBe(200);
    expect((await getMailboxes(testAccount.setupCookie)).status).toBe(401);
    expect((await getMailboxes(otherRecoveryCookie)).status).toBe(401);
  });

  it('keeps the former app and every session when its code does not match', async () => {
    const replacement = await replaceAuthenticator(recoveryCookie, wrongTotpCode);

    expect(replacement.status).toBe(401);
    expect(await errorCode(replacement)).toBe('INVALID_SECOND_FACTOR');
    expect((await getMailboxes(testAccount.setupCookie)).status).toBe(200);
  });
});

describe('a new authenticator app, and the passkeys', () => {
  it('removes every passkey: one of them may be on the lost device', async () => {
    await storeTestPasskey(database);

    expect((await replaceAuthenticator(recoveryCookie)).status).toBe(204);

    expect(await database.select().from(passkey)).toEqual([]);
  });

  it('keeps the passkeys when the code of the new app does not match', async () => {
    await storeTestPasskey(database);

    expect((await replaceAuthenticator(recoveryCookie, wrongTotpCode)).status).toBe(401);

    expect(await database.select().from(passkey)).toHaveLength(1);
  });
});

describe('the replacement routes, for any other session', () => {
  it.each([
    ['without a session', undefined],
    ['with an unknown session', '__Host-mailbox_session=unknown'],
  ])('refuses to give or replace an app %s', async (_case, cookie) => {
    const { enrollment, replacement } = await tryReplacementRoutes(cookie);

    expect([enrollment.status, replacement.status]).toEqual([401, 401]);
    expect(await errorCode(replacement)).toBe('UNAUTHENTICATED');
  });

  // Regression: a session left open on a lost device could replace the app, and lock its owner out.
  it('refuses a session opened with the authenticator app, which keeps working', async () => {
    const { enrollment, replacement } = await tryReplacementRoutes(testAccount.setupCookie);

    expect([enrollment.status, replacement.status]).toEqual([403, 403]);
    expect(await errorCode(replacement)).toBe('AUTHENTICATOR_REPLACEMENT_NOT_REQUIRED');
    expect((await signInWithFormerApp()).status).toBe(204);
  });

  it('refuses a session opened with a recovery code once its new app is set up', async () => {
    await replaceAuthenticator(recoveryCookie);

    const { enrollment, replacement } = await tryReplacementRoutes(recoveryCookie);

    expect([enrollment.status, replacement.status]).toEqual([403, 403]);
    expect(await errorCode(replacement)).toBe('AUTHENTICATOR_REPLACEMENT_NOT_REQUIRED');
  });
});
