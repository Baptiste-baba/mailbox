import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { mailbox } from './mailbox.ts';

/** A folder the user created at the provider, where it is called a label (Gmail). */
export const folder = pgTable(
  'folder',
  {
    id: uuid().primaryKey().defaultRandom(),
    mailboxId: uuid()
      .notNull()
      .references(() => mailbox.id, { onDelete: 'cascade' }),
    providerFolderId: text().notNull(),
    name: text().notNull(),
  },
  (table) => [unique('folder_provider_id_unique').on(table.mailboxId, table.providerFolderId)],
);
