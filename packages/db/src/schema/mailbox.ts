import { pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { paletteColor } from './palette-color.ts';

export const mailProvider = pgEnum('mail_provider', ['gmail']);

export const mailboxStatus = pgEnum('mailbox_status', ['connected', 'reconnect_required']);

/** A mail account the user connected. Its mail stays at the provider: the tables below mirror it. */
export const mailbox = pgTable(
  'mailbox',
  {
    id: uuid().primaryKey().defaultRandom(),
    provider: mailProvider().notNull(),
    address: text().notNull(),
    /** Name the user gave the mailbox, such as "Perso". */
    name: text().notNull(),
    color: paletteColor().notNull(),
    /** Whether the provider still accepts the token below; when it does not, the user signs in again. */
    status: mailboxStatus().notNull().default('connected'),
    /** What renews the access to the provider, encrypted with the key of the configuration. */
    refreshTokenEncrypted: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    /**
     * When the copy of the whole mailbox started: at its connection, or since, each time the
     * provider no longer told what had changed and the copy was started over. A mail stored
     * before that date has not been seen by the current copy. Kept to the millisecond, as a Date
     * keeps it: the date a job loaded compares exactly with the one stored.
     */
    initialSyncStartedAt: timestamp({ withTimezone: true, precision: 3 }).notNull().defaultNow(),
    /**
     * Where the copy of the mailbox resumes: what asks the provider for the next page of its
     * mails. Null before the first page, and once the last one was read.
     */
    initialSyncPageToken: text(),
    /** When the copy of the whole mailbox ended; null while it is under way. */
    initialSyncCompletedAt: timestamp({ withTimezone: true }),
    /**
     * What asks the provider for the changes of the mailbox since they were last read. Null until
     * a copy starts, and when the provider no longer knows the one it gave.
     */
    syncCursor: text(),
  },
  (table) => [unique('mailbox_provider_address_unique').on(table.provider, table.address)],
);
