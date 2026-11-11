import { createDatabase, type Database, session, setupCode } from '@mailbox/db';
import { sql } from 'drizzle-orm';
import { hashToken } from '../src/auth/token-hash.ts';

/** A connection to the test database of `.env.test`, for tests that arrange or inspect its rows. */
export function openTestDatabase(): Database {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error('.env.test sets no DATABASE_URL');
  }
  return createDatabase(databaseUrl, (error) => {
    throw error;
  });
}

/** Back to a fresh instance: no account, no passkey, no session, no setup code, no failed attempt. */
export async function resetAuthTables(database: Database): Promise<void> {
  await database.execute(
    sql`truncate account, passkey, recovery_code, session, auth_attempt, setup_code restart identity`,
  );
}

/** A setup code the test knows, as if read in the server logs. */
export async function insertSetupCode(
  database: Database,
  code: string,
  expiresAt: Date,
): Promise<void> {
  await database.insert(setupCode).values({ codeHash: hashToken(code), expiresAt });
}

/** As if the last proof of identity on every device dated from eleven minutes ago. */
export async function letIdentityConfirmationAge(database: Database): Promise<void> {
  await database.update(session).set({ identityConfirmedAt: sql`now() - interval '11 minutes'` });
}
