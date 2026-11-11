import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { mailbox } from './mailbox.ts';

/**
 * A conversation. Everything a mail list shows of it is kept here, worked out again whenever one of
 * its messages changes: a list reads this table alone, in the order of an index.
 */
export const thread = pgTable(
  'thread',
  {
    id: uuid().primaryKey().defaultRandom(),
    mailboxId: uuid()
      .notNull()
      .references(() => mailbox.id, { onDelete: 'cascade' }),
    providerThreadId: text().notNull(),
    subject: text().notNull(),
    /** Sender of the latest message; the name is empty when they gave none. */
    senderName: text().notNull(),
    senderAddress: text().notNull(),
    /** Start of the latest message, as plain text. */
    snippet: text().notNull(),
    lastMessageAt: timestamp({ withTimezone: true }).notNull(),
    messageCount: integer().notNull(),
    /** At least one message is unread. */
    unread: boolean().notNull(),
    /** At least one message is in the inbox. */
    inInbox: boolean().notNull(),
    hasAttachments: boolean().notNull(),
  },
  (table) => [
    unique('thread_provider_id_unique').on(table.mailboxId, table.providerThreadId),
    // One index per list, read backwards for the most recent first, the id settling equal dates:
    // every mailbox or one, and all mail, the inbox or unread mail. An unread inbox reads the unread
    // index, which stays small.
    index('thread_recent_idx').on(table.lastMessageAt, table.id),
    index('thread_mailbox_recent_idx').on(table.mailboxId, table.lastMessageAt, table.id),
    index('thread_inbox_idx').on(table.lastMessageAt, table.id).where(sql`${table.inInbox}`),
    index('thread_mailbox_inbox_idx')
      .on(table.mailboxId, table.lastMessageAt, table.id)
      .where(sql`${table.inInbox}`),
    index('thread_unread_idx').on(table.lastMessageAt, table.id).where(sql`${table.unread}`),
    index('thread_mailbox_unread_idx')
      .on(table.mailboxId, table.lastMessageAt, table.id)
      .where(sql`${table.unread}`),
  ],
);
