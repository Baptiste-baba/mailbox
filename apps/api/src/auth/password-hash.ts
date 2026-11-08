import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(argon2);

interface Argon2Cost {
  memory: number;
  passes: number;
  parallelism: number;
}

// The minimum OWASP recommends for Argon2id: 19 MiB of memory, 2 passes, 1 lane.
const COST: Argon2Cost = { memory: 19_456, passes: 2, parallelism: 1 };
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;
// The PHC string format, shared by Argon2 libraries: the cost travels with each hash.
const HASH_FORMAT =
  /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

// The same password typed on two devices may reach the server in two Unicode forms ("é" as one
// character, or as "e" and an accent): both must give the same hash.
function derive(password: string, salt: Buffer, cost: Argon2Cost, length: number) {
  return deriveKey('argon2id', {
    message: password.normalize('NFKC'),
    nonce: salt,
    tagLength: length,
    ...cost,
  });
}

// PHC strings use base64 without its padding.
function toPhcBase64(bytes: Buffer): string {
  return bytes.toString('base64').replace(/=+$/, '');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await derive(password, salt, COST, HASH_LENGTH);
  const { memory, passes, parallelism } = COST;
  return `$argon2id$v=19$m=${memory},t=${passes},p=${parallelism}$${toPhcBase64(salt)}$${toPhcBase64(hash)}`;
}

/** @throws Error when the stored hash is not an Argon2id hash. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const match = HASH_FORMAT.exec(storedHash);
  if (match === null) {
    throw new Error('Not an Argon2id password hash');
  }
  // Every group is present once the format matched: these defaults are never used.
  const [, memory = '', passes = '', parallelism = '', salt = '', hash = ''] = match;
  const expected = Buffer.from(hash, 'base64');
  const cost = { memory: Number(memory), passes: Number(passes), parallelism: Number(parallelism) };
  const actual = await derive(password, Buffer.from(salt, 'base64'), cost, expected.length);
  return timingSafeEqual(actual, expected);
}
