import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** The one-time code that guards the creation of the account. Only its hash is kept. */
export const setupCode = pgTable('setup_code', {
  id: serial().primaryKey(),
  codeHash: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
