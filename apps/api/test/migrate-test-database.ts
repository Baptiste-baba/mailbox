import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createDatabase, migrateDatabase } from '@mailbox/db';

/** Brings the test database to the current schema, once, before any test runs. */
export default async function migrateTestDatabase(): Promise<void> {
  const { DATABASE_URL } = parseEnv(
    readFileSync(new URL('../../../.env.test', import.meta.url), 'utf8'),
  );
  if (DATABASE_URL === undefined) {
    throw new Error('.env.test sets no DATABASE_URL');
  }
  const database = createDatabase(DATABASE_URL, (error) => {
    throw error;
  });
  try {
    await migrateDatabase(database);
  } finally {
    await database.$client.end();
  }
}
