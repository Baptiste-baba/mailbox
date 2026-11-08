import { sql } from 'drizzle-orm';
import { bigint, check, pgTable, smallint, text, timestamp } from 'drizzle-orm/pg-core';

/** The one person who uses this instance. */
export const account = pgTable(
  'account',
  {
    // A single row: an instance serves one user.
    id: smallint().primaryKey().default(1),
    username: text().notNull(),
    passwordHash: text().notNull(),
    /** Secret of the authenticator app, encrypted with the key of the configuration. */
    totpSecretEncrypted: text().notNull(),
    /** Time step of the last code accepted, so that a code never works twice. */
    totpLastUsedStep: bigint({ mode: 'number' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('account_single_row', sql`${table.id} = 1`)],
);
