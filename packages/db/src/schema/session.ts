import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** A device the user is signed in on. The token itself never reaches the database, only its hash. */
export const session = pgTable(
  'session',
  {
    id: uuid().primaryKey().defaultRandom(),
    tokenHash: text().notNull().unique('session_token_hash_unique'),
    /** Browser and system, from the user agent, to recognise the device in the list of sessions. */
    userAgent: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [index('session_expires_at_idx').on(table.expiresAt)],
);
