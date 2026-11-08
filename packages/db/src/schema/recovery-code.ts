import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/** Single-use codes that let the user in without the authenticator app. Only their hash is kept. */
export const recoveryCode = pgTable('recovery_code', {
  id: serial().primaryKey(),
  codeHash: text().notNull().unique('recovery_code_code_hash_unique'),
  usedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
