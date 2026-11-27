import { type Database, message, notifyMailboxChange, thread } from '@mailbox/db';
import { and, eq } from 'drizzle-orm';
import { summariseThread } from './summarise-thread.ts';

/**
 * Removes a mail the provider no longer has, with its files, and brings its thread up to date: a
 * thread left without a mail goes too. A mail that was never stored changes nothing.
 */
export async function removeMessage(
  database: Database,
  mailboxId: string,
  providerMessageId: string,
): Promise<void> {
  await database.transaction(async (transaction) => {
    const stored = and(
      eq(message.mailboxId, mailboxId),
      eq(message.providerMessageId, providerMessageId),
    );
    const [found] = await transaction
      .select({ threadId: message.threadId })
      .from(message)
      .where(stored);
    if (found === undefined) {
      return;
    }
    // Locked until the mail is gone: a mail of the thread stored meanwhile summarises it after.
    await transaction
      .select({ id: thread.id })
      .from(thread)
      .where(eq(thread.id, found.threadId))
      .for('update');
    await transaction.delete(message).where(stored);
    await summariseThread(transaction, found.threadId);
    await notifyMailboxChange(transaction, mailboxId);
  });
}
