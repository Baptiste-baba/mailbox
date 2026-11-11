import { attachment, type Database, message, thread } from '@mailbox/db';
import { asc, eq, isNull } from 'drizzle-orm';

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
          bodyText: true,
        },
        with: {
          attachments: {
            // A file the body displays, such as a logo, is part of the body, not an attachment.
            where: isNull(attachment.contentId),
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
