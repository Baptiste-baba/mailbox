import { index, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { folder } from './folder.ts';
import { message } from './message.ts';

/** A message filed in a folder. A message may be in several: Gmail labels work this way. */
export const messageFolder = pgTable(
  'message_folder',
  {
    messageId: uuid()
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    folderId: uuid()
      .notNull()
      .references(() => folder.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ name: 'message_folder_pk', columns: [table.messageId, table.folderId] }),
    // Removing a folder finds its messages here, instead of reading the whole table.
    index('message_folder_folder_idx').on(table.folderId),
  ],
);
