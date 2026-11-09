import { randomBytes } from 'node:crypto';
import { type Database, session } from '@mailbox/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, lte } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { hashToken } from './token-hash.ts';

/** A session lasts this long after its last use: used daily, it never ends on its own. */
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;
/**
 * A session in use is pushed back at most this often: between two, a request reads the session
 * without writing it.
 */
const RENEWAL_INTERVAL_MS = 60 * 60 * 1_000;
const TOKEN_BYTES = 32;
/** The user agent is a header anyone can fill: kept bounded. */
const USER_AGENT_MAX_LENGTH = 512;

export interface StartedSession {
  /** Goes into the cookie; only its hash is stored. */
  token: string;
  expiresAt: Date;
}

function nextExpiry(): Date {
  return new Date(Date.now() + SESSION_LIFETIME_MS);
}

/** Signed-in devices: start, resume and end a session. */
@Injectable()
export class SessionService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async start(userAgent: string): Promise<StartedSession> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const expiresAt = nextExpiry();
    await this.database.delete(session).where(lte(session.expiresAt, new Date()));
    await this.database.insert(session).values({
      tokenHash: hashToken(token),
      userAgent: userAgent.slice(0, USER_AGENT_MAX_LENGTH),
      expiresAt,
    });
    return { token, expiresAt };
  }

  /**
   * The session of a token, its expiry pushed back when it was last pushed over an hour ago;
   * undefined when it is unknown or expired.
   */
  async resume(token: string): Promise<StartedSession | undefined> {
    const now = new Date();
    const [found] = await this.database
      .select({ id: session.id, expiresAt: session.expiresAt })
      .from(session)
      .where(and(eq(session.tokenHash, hashToken(token)), gt(session.expiresAt, now)))
      .limit(1);
    if (found === undefined) {
      return undefined;
    }
    if (found.expiresAt.getTime() > now.getTime() + SESSION_LIFETIME_MS - RENEWAL_INTERVAL_MS) {
      return { token, expiresAt: found.expiresAt };
    }
    const expiresAt = nextExpiry();
    await this.database
      .update(session)
      .set({ lastSeenAt: now, expiresAt })
      .where(eq(session.id, found.id));
    return { token, expiresAt };
  }

  async end(token: string): Promise<void> {
    await this.database.delete(session).where(eq(session.tokenHash, hashToken(token)));
  }
}
