import { createDatabase } from '@mailbox/db';
import * as z from 'zod';
import { parseApiConfig } from '../config/api-config.ts';
import { resetAuthentication } from './reset-authentication.ts';

/** What the user types to confirm: an accidental Enter changes nothing. */
export const RESET_CONFIRMATION = 'reset';

export interface CommandConsole {
  ask: (question: string) => Promise<string>;
  print: (text: string) => void;
}

/**
 * Resets the access to MailBox from the server, for whoever lost the password, or both the
 * authenticator app and the recovery codes. Asks for confirmation first.
 * @returns whether it succeeded, for the exit code.
 */
export async function runResetCommand(
  environment: Record<string, string | undefined>,
  terminal: CommandConsole,
): Promise<boolean> {
  const config = parseApiConfig(environment);
  if (!config.success) {
    terminal.print(`Invalid configuration:\n${z.prettifyError(config.error)}\n`);
    return false;
  }
  const answer = await terminal.ask(
    'This erases the password, the authenticator app, the recovery codes and every session of MailBox.\n' +
      'Mailboxes and mail are kept, and the setup opens again.\n' +
      `Type "${RESET_CONFIRMATION}" to go on: `,
  );
  if (answer.trim() !== RESET_CONFIRMATION) {
    terminal.print('Nothing was changed.\n');
    return true;
  }
  const database = createDatabase(config.data.databaseUrl, (error) => {
    throw error;
  });
  try {
    const setupCode = await resetAuthentication(database);
    terminal.print(
      `Access reset. Open MailBox and enter the setup code ${setupCode}, valid for an hour.\n`,
    );
    return true;
  } finally {
    await database.$client.end();
  }
}
