import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

// One user only: a few connections cover concurrent requests and keep Postgres memory low on the NAS.
const MAX_CONNECTIONS = 5;
const CONNECTION_TIMEOUT_MS = 5_000;

export function createDatabase(databaseUrl: string, onIdleClientError: (error: Error) => void) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: MAX_CONNECTIONS,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  });
  // The pool already discards the broken client; without a listener, a Postgres restart would crash the process.
  pool.on('error', onIdleClientError);
  return drizzle({ client: pool });
}

export type Database = ReturnType<typeof createDatabase>;

export async function pingDatabase(database: Database): Promise<void> {
  await database.execute(sql`select 1`);
}
