import { randomBytes } from 'node:crypto';
import type { MailProviderName, PaletteColor } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';
import { hashToken } from '../auth/token-hash.ts';

/** What a connection in progress will give: a new mailbox, or its access back to an existing one. */
export type ConnectionTarget =
  | { kind: 'newMailbox'; name: string; color: PaletteColor }
  | { kind: 'reconnection'; mailboxId: string };

export interface PendingConnection {
  provider: MailProviderName;
  /** The secret behind the code challenge sent to the provider (PKCE). */
  codeVerifier: string;
  target: ConnectionTarget;
}

/** Time to sign in at the provider and come back, before the connection has to be started again. */
export const CONNECTION_LIFETIME_MS = 10 * 60 * 1_000;
const STATE_BYTES = 32;

interface WaitingConnection {
  connection: PendingConnection;
  sessionTokenHash: string;
  expiresAt: number;
}

/**
 * The connections whose user is away, signing in at a provider. Kept in memory: the api runs as one
 * process, and losing them on a restart only makes the user start again. Each is known by a random
 * state, works once, for ten minutes, and for the session that started it: the address the provider
 * sends the browser back to is of no use to anyone else.
 */
@Injectable()
export class PendingConnections {
  private readonly waiting = new Map<string, WaitingConnection>();

  /** Keeps the connection for the session, and gives the state that names it. */
  start(connection: PendingConnection, sessionToken: string): string {
    this.forgetExpired();
    const state = randomBytes(STATE_BYTES).toString('base64url');
    this.waiting.set(state, {
      connection,
      sessionTokenHash: hashToken(sessionToken),
      expiresAt: Date.now() + CONNECTION_LIFETIME_MS,
    });
    return state;
  }

  /** Forgets the connection a state names, and gives it if this session was still waiting for it. */
  consume(state: string, sessionToken: string): PendingConnection | undefined {
    const waiting = this.waiting.get(state);
    if (waiting === undefined) {
      return undefined;
    }
    this.waiting.delete(state);
    const stillWaited =
      waiting.expiresAt > Date.now() && waiting.sessionTokenHash === hashToken(sessionToken);
    return stillWaited ? waiting.connection : undefined;
  }

  // Only a session that just proved who it is starts connections: they are few, going through
  // them all costs nothing.
  private forgetExpired(): void {
    const now = Date.now();
    for (const [state, waiting] of this.waiting) {
      if (waiting.expiresAt <= now) {
        this.waiting.delete(state);
      }
    }
  }
}
