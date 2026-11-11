import { randomUUID } from 'node:crypto';
import { type Database, mailbox, message, thread } from '@mailbox/db';
import { sql } from 'drizzle-orm';

/** What stands for the encrypted token of a test mailbox: no answer of the api may contain it. */
export const TEST_REFRESH_TOKEN = 'sealed-refresh-token';

/** No mailbox, and so no mail: everything a mailbox owns goes with it. */
export async function resetMailTables(database: Database): Promise<void> {
  await database.execute(sql`truncate mailbox cascade`);
}

type TestMailbox = Pick<typeof mailbox.$inferInsert, 'name' | 'address' | 'status' | 'createdAt'>;

/** A connected mailbox, stored as if the user had signed in at the provider: its id. */
export async function insertTestMailbox(database: Database, values: TestMailbox): Promise<string> {
  const [stored] = await database
    .insert(mailbox)
    .values({
      provider: 'gmail',
      color: 'navy',
      refreshTokenEncrypted: TEST_REFRESH_TOKEN,
      ...values,
    })
    .returning({ id: mailbox.id });
  return idOf(stored);
}

interface TestThread {
  /** When its latest message was sent. */
  lastMessageAt: Date;
  unread?: boolean;
  inInbox?: boolean;
  /** Messages are one minute apart, the latest at `lastMessageAt`. */
  messageCount?: number;
}

/** A thread and its messages, stored as a synchronisation would: its id. */
export async function insertTestThread(
  database: Database,
  mailboxId: string,
  { lastMessageAt, unread = false, inInbox = true, messageCount = 1 }: TestThread,
): Promise<string> {
  const providerThreadId = randomUUID();
  const sender = { name: 'Camille Roux', address: 'camille.roux@example.com' };
  const snippet = 'Bonjour, voici le devis signé.';
  const [stored] = await database
    .insert(thread)
    .values({
      mailboxId,
      providerThreadId,
      subject: 'Devis signé',
      senderName: sender.name,
      senderAddress: sender.address,
      snippet,
      lastMessageAt,
      messageCount,
      unread,
      inInbox,
      hasAttachments: false,
    })
    .returning({ id: thread.id });
  const threadId = idOf(stored);
  await database.insert(message).values(
    Array.from({ length: messageCount }, (_, index) => ({
      threadId,
      mailboxId,
      providerMessageId: `${providerThreadId}-${index}`,
      fromName: sender.name,
      fromAddress: sender.address,
      toRecipients: [{ name: 'Alex Martin', address: 'alex.martin@example.com' }],
      ccRecipients: [],
      sentAt: new Date(lastMessageAt.getTime() - (messageCount - 1 - index) * 60_000),
      snippet,
      bodyText: `${snippet}\n\nMessage ${index + 1}`,
      unread,
      inInbox,
    })),
  );
  return threadId;
}

function idOf(stored: { id: string } | undefined): string {
  if (stored === undefined) {
    throw new Error('The insert returned no row');
  }
  return stored.id;
}
