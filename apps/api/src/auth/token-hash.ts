import { createHash } from 'node:crypto';

/**
 * What the database keeps in place of a session token or a single-use code. They are random enough
 * that a fast hash cannot be reversed by guessing, unlike a password.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
