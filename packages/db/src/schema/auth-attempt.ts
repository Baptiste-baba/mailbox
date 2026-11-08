import { index, pgEnum, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const authAttemptKind = pgEnum('auth_attempt_kind', ['setup', 'password', 'second_factor']);

/** A failed sign-in step, counted to slow down whoever keeps guessing. */
export const authAttempt = pgTable(
  'auth_attempt',
  {
    id: serial().primaryKey(),
    kind: authAttemptKind().notNull(),
    attemptedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('auth_attempt_attempted_at_idx').on(table.attemptedAt)],
);
