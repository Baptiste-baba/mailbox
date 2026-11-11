import { account, type Database, passkey } from '@mailbox/db';
import { setupResponseSchema, totpEnrollmentSchema } from '@mailbox/shared';
import { callAuth, sessionCookieFrom } from './auth-requests.ts';
import { totpCode } from './authenticator-app.ts';
import { createTestPasskey, type TestPasskey } from './passkey-authenticator.ts';
import type { RunningApi } from './start-api.ts';
import { insertSetupCode, resetAuthTables } from './test-database.ts';

export const TEST_USERNAME = 'alex';
export const TEST_PASSWORD = 'correct horse battery staple';
export const TEST_SETUP_CODE = 'K7QD-M2XA-PT4R';

export interface TestAccount {
  /** Secret of the authenticator app; its current code was spent by the setup. */
  totpSecret: string;
  recoveryCodes: string[];
  /** Cookie of the session the setup opened. */
  setupCookie: string;
}

/** Creates the account through the setup routes, as the user would, on a fresh instance. */
export async function createTestAccount(api: RunningApi, database: Database): Promise<TestAccount> {
  const setupCode = TEST_SETUP_CODE;
  await insertSetupCode(database, setupCode, new Date(Date.now() + 60_000));
  const enrollment = await callAuth(api, 'POST', '/setup/totp-secret', {
    body: { setupCode, username: TEST_USERNAME },
  });
  const { secret } = totpEnrollmentSchema.parse(await enrollment.json());
  const setup = await callAuth(api, 'POST', '/setup', {
    body: {
      setupCode,
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      totpSecret: secret,
      totpCode: totpCode(secret),
    },
  });
  const { recoveryCodes } = setupResponseSchema.parse(await setup.json());
  return { totpSecret: secret, recoveryCodes, setupCookie: sessionCookieFrom(setup) };
}

/** A fresh instance with its account: the `Cookie` header of a signed-in session. */
export async function signInOnFreshInstance(api: RunningApi, database: Database): Promise<string> {
  await resetAuthTables(database);
  return (await createTestAccount(api, database)).setupCookie;
}

/** Signs in on another device, with the password and a second factor: its `Cookie` header. */
export async function signInElsewhere(
  api: RunningApi,
  secondFactor: { kind: string; code: string | undefined },
): Promise<string> {
  const login = await callAuth(api, 'POST', '/login', {
    body: { username: TEST_USERNAME, password: TEST_PASSWORD, secondFactor },
  });
  return sessionCookieFrom(login);
}

/** The user handle of the test account's passkeys: the 16 bytes of its passkey user id. */
export async function testUserHandle(database: Database): Promise<string> {
  const [owner] = await database.select({ passkeyUserId: account.passkeyUserId }).from(account);
  return Buffer.from(owner?.passkeyUserId.replaceAll('-', '') ?? '', 'hex').toString('base64url');
}

/** A passkey of the test account, stored as if the user had added it earlier. */
export async function storeTestPasskey(database: Database): Promise<TestPasskey> {
  const testPasskey = createTestPasskey(await testUserHandle(database));
  await database.insert(passkey).values({
    credentialId: testPasskey.credentialId,
    publicKey: testPasskey.publicKey,
    signCount: 0,
    name: 'iPhone',
  });
  return testPasskey;
}
