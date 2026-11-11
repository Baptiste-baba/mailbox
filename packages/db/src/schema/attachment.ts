import { integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { message } from './message.ts';

/** What is known of a file attached to a message. The file itself stays at the provider. */
export const attachment = pgTable(
  'attachment',
  {
    id: uuid().primaryKey().defaultRandom(),
    messageId: uuid()
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    /** Rank among the files of the message, from 0, in the order the mail carries them. */
    position: integer().notNull(),
    fileName: text().notNull(),
    mimeType: text().notNull(),
    /** Size in bytes. */
    size: integer().notNull(),
    /**
     * What the HTML body calls the file when it displays it, a logo in a signature for instance.
     * Such a file is part of the body: it does not count as an attachment of the mail.
     */
    contentId: text(),
  },
  (table) => [unique('attachment_position_unique').on(table.messageId, table.position)],
);
