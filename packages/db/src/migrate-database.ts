import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Database } from './database.ts';

// Shipped with the package, next to the compiled code.
const MIGRATIONS_FOLDER = fileURLToPath(new URL('../migrations', import.meta.url));

/** Brings the schema up to date; migrations already applied are skipped. */
export async function migrateDatabase(database: Database): Promise<void> {
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
}
