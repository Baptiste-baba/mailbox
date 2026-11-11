import { boolean, index, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { mailbox } from './mailbox.ts';
import { thread } from './thread.ts';

interface Recipient {
  /** Display name, empty when none was given. */
  name: string;
  address: string;
}

/** A mail, stored once: folders are relations to it, never copies. */
export const message = pgTable(
  'message',
  {
    id: uuid().primaryKey().defaultRandom(),
    threadId: uuid()
      .notNull()
      .references(() => thread.id, { onDelete: 'cascade' }),
    mailboxId: uuid()
      .notNull()
      .references(() => mailbox.id, { onDelete: 'cascade' }),
    providerMessageId: text().notNull(),
    /** Display name of the sender, empty when they gave none. */
    fromName: text().notNull(),
    fromAddress: text().notNull(),
    toRecipients: jsonb().$type<Recipient[]>().notNull(),
    ccRecipients: jsonb().$type<Recipient[]>().notNull(),
    sentAt: timestamp({ withTimezone: true }).notNull(),
    /** Start of the message, as plain text. */
    snippet: text().notNull(),
    /** A mail carries a plain text body, an HTML one, or both. */
    bodyText: text(),
    bodyHtml: text(),
    unread: boolean().notNull(),
    inInbox: boolean().notNull(),
  },
  (table) => [
    unique('message_provider_id_unique').on(table.mailboxId, table.providerMessageId),
    index('message_thread_idx').on(table.threadId, table.sentAt),
  ],
);
