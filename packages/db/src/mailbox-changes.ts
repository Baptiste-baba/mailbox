import { sql } from 'drizzle-orm';
import pg from 'pg';
import type { Database, Transaction } from './database.ts';

/**
 * The channel of Postgres on which a change of the mail or of the state of a mailbox is told. Its
 * payload is the id of the mailbox, and nothing else: whoever listens reads what changed.
 */
export const MAILBOX_CHANGES_CHANNEL = 'mailbox_changes';

const CONNECTION_TIMEOUT_MS = 5_000;

/**
 * Tells whoever listens that the mail or the state of a mailbox changed. Inside a transaction, it
 * is told once the transaction commits, and not at all if it rolls back.
 */
export async function notifyMailboxChange(
  executor: Database | Transaction,
  mailboxId: string,
): Promise<void> {
  await executor.execute(sql`select pg_notify(${MAILBOX_CHANGES_CHANNEL}, ${mailboxId})`);
}

export interface MailboxChangesListener {
  close: () => Promise<void>;
}

interface MailboxChangesHandlers {
  /** Given the payload as Postgres hands it: the id of a mailbox, unchecked. */
  onChange: (payload: string) => void;
  /** Called once, when the connection is lost: the listener is then of no use any more. */
  onLost: (error: unknown) => void;
}

/**
 * Listens to the changes of the mailboxes, on a connection of its own: a listening connection
 * cannot be shared with queries.
 */
export async function listenToMailboxChanges(
  databaseUrl: string,
  { onChange, onLost }: MailboxChangesHandlers,
): Promise<MailboxChangesListener> {
  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  let over = false;
  const lose = (error: unknown) => {
    if (!over) {
      over = true;
      onLost(error);
    }
  };
  client.on('notification', ({ channel, payload }) => {
    if (channel === MAILBOX_CHANGES_CHANNEL && payload !== undefined) {
      onChange(payload);
    }
  });
  client.on('error', lose);
  client.on('end', () => lose(new Error('The listening connection ended')));
  await client.connect();
  await client.query(`listen ${MAILBOX_CHANGES_CHANNEL}`);
  return {
    close: async () => {
      over = true;
      await client.end();
    },
  };
}
