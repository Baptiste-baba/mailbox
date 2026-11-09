import type { Database } from '@mailbox/db';
import { setupResponseSchema, totpEnrollmentSchema } from '@mailbox/shared';
import { callAuth, sessionCookieFrom } from './auth-requests.ts';
import { totpCode } from './authenticator-app.ts';
import type { RunningApi } from './start-api.ts';
import { insertSetupCode, resetAuthTables } from './test-database.ts';

export const TEST_USERNAME = 'alex';
export const TEST_PASSWORD = 'correct horse battery staple';

export interface TestAccount {
  /** Secret of the authenticator app; its current code was spent by the setup. */
  totpSecret: string;
  recoveryCodes: string[];
  /** Cookie of the session the setup opened. */
  setupCookie: string;
}

/** Creates the account through the setup routes, as the user would, on a fresh instance. */
export async function createTestAccount(api: RunningApi, database: Database): Promise<TestAccount> {
  const setupCode = 'K7QD-M2XA-PT4R';
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
