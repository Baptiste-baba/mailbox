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
  },
  (table) => [unique('mailbox_provider_address_unique').on(table.provider, table.address)],
);
