import { account, authAttempt, type Database, recoveryCode, session } from '@mailbox/db';
import { replaceSetupCode } from './setup-code.ts';

/**
 * Erases the account (password, authenticator app, recovery codes), every session and every
 * failed attempt, then opens the setup again. Mailboxes and mail are kept. Returns the new setup
 * code, in clear this once.
 */
export function resetAuthentication(database: Database): Promise<string> {
  return database.transaction(async (transaction) => {
    await transaction.delete(session);
    await transaction.delete(recoveryCode);
    await transaction.delete(authAttempt);
    await transaction.delete(account);
    return replaceSetupCode(transaction);
  });
}
