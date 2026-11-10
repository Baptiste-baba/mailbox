import { randomBytes } from 'node:crypto';
import { type Database, session, type Transaction } from '@mailbox/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, lte, ne } from 'drizzle-orm';
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

export interface ResumedSession extends StartedSession {
  /** Opened with a recovery code, and no new authenticator app set up since. */
  mustReplaceAuthenticator: boolean;
  /** When the user last proved who they are on this device; null for a recovery code session. */
  identityConfirmedAt: Date | null;
  /** Its end was just pushed back: the cookie must follow. */
  renewed: boolean;
}

function nextExpiry(): Date {
  return new Date(Date.now() + SESSION_LIFETIME_MS);
}

/** Signed-in devices: start, resume and end a session. */
@Injectable()
export class SessionService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** @param mustReplaceAuthenticator The session was opened with a recovery code. */
  async start(userAgent: string, mustReplaceAuthenticator: boolean): Promise<StartedSession> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    const expiresAt = nextExpiry();
    await this.database.delete(session).where(lte(session.expiresAt, new Date()));
    await this.database.insert(session).values({
      tokenHash: hashToken(token),
      userAgent: userAgent.slice(0, USER_AGENT_MAX_LENGTH),
      expiresAt,
      mustReplaceAuthenticator,
      // Signing in proves who one is. A recovery code session only replaces the authenticator app.
      identityConfirmedAt: mustReplaceAuthenticator ? null : new Date(),
    });
    return { token, expiresAt };
  }

  /**
   * The session of a token, its expiry pushed back when it was last pushed over an hour ago;
   * undefined when it is unknown or expired.
   */
  async resume(token: string): Promise<ResumedSession | undefined> {
    const now = new Date();
    const [found] = await this.database
      .select({
        id: session.id,
        expiresAt: session.expiresAt,
        mustReplaceAuthenticator: session.mustReplaceAuthenticator,
        identityConfirmedAt: session.identityConfirmedAt,
      })
      .from(session)
      .where(and(eq(session.tokenHash, hashToken(token)), gt(session.expiresAt, now)))
      .limit(1);
    if (found === undefined) {
      return undefined;
    }
    const { mustReplaceAuthenticator, identityConfirmedAt } = found;
    const resumed = { token, mustReplaceAuthenticator, identityConfirmedAt };
    if (found.expiresAt.getTime() > now.getTime() + SESSION_LIFETIME_MS - RENEWAL_INTERVAL_MS) {
      return { ...resumed, expiresAt: found.expiresAt, renewed: false };
    }
    const expiresAt = nextExpiry();
    await this.database
      .update(session)
      .set({ lastSeenAt: now, expiresAt })
      .where(eq(session.id, found.id));
    return { ...resumed, expiresAt, renewed: true };
  }

  /** Ends every session but the one of `token`. */
  async endAllBut(transaction: Transaction, token: string): Promise<void> {
    await transaction.delete(session).where(ne(session.tokenHash, hashToken(token)));
  }

  /**
   * The session of `token` set up a new authenticator app: it reaches the whole app again. Its user
   * just proved who they are, with the password, a recovery code and a code of the new app.
   */
  async endAuthenticatorReplacement(transaction: Transaction, token: string): Promise<void> {
    await transaction
      .update(session)
      .set({ mustReplaceAuthenticator: false, identityConfirmedAt: new Date() })
      .where(eq(session.tokenHash, hashToken(token)));
  }

  /** The user just proved again who they are, on the device of `token`. */
  async confirmIdentity(token: string): Promise<void> {
    await this.database
      .update(session)
      .set({ identityConfirmedAt: new Date() })
      .where(eq(session.tokenHash, hashToken(token)));
  }

  async end(token: string): Promise<void> {
    await this.database.delete(session).where(eq(session.tokenHash, hashToken(token)));
  }
}
