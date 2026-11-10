import { bigint, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** A passkey the user signs in with. Their password manager keeps its private key, never the app. */
export const passkey = pgTable('passkey', {
  id: uuid().primaryKey().defaultRandom(),
  /** What the password manager calls the passkey, in base64url: a sign-in names it this way. */
  credentialId: text().notNull().unique('passkey_credential_id_unique'),
  /** The public key that checks the passkey's signatures, in COSE format and base64url. */
  publicKey: text().notNull(),
  /** Signatures counted by the passkey: one counting backwards was copied. Synced passkeys stay at 0. */
  signCount: bigint({ mode: 'number' }).notNull(),
  /** What the user called it when adding it, such as "iPhone". */
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp({ withTimezone: true }),
});
