import { attachment, type Database, isAttachedFile, message, thread } from '@mailbox/db';
import { asc, eq, sql } from 'drizzle-orm';

/** One query: the thread, its messages oldest first, and the files attached to each. */
export function findThreadWithMessages(database: Database, threadId: string) {
  return database.query.thread.findFirst({
    where: eq(thread.id, threadId),
    columns: { id: true, mailboxId: true, subject: true },
    with: {
      messages: {
        orderBy: [asc(message.sentAt), asc(message.id)],
        // Only what a thread shows: the HTML body, by far the heaviest column, is left unread.
        columns: {
          id: true,
          fromName: true,
          fromAddress: true,
          toRecipients: true,
          ccRecipients: true,
          sentAt: true,
          snippet: true,
          bodyText: true,
        },
        extras: { hasHtml: sql<boolean>`${message.bodyHtml} is not null`.as('has_html') },
        with: {
          attachments: {
            where: isAttachedFile,
            orderBy: asc(attachment.position),
            columns: { id: true, fileName: true, mimeType: true, size: true },
          },
        },
      },
    },
  });
}

export type StoredThreadWithMessages = NonNullable<
  Awaited<ReturnType<typeof findThreadWithMessages>>
>;
