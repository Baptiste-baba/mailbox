import type { MailProviderName, PaletteColor } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

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

/**
 * The connections whose user is away, signing in at a provider. Kept in memory: the api runs as one
 * process, and losing them on a restart only makes the user start again. Each is known by a random
 * state, works once, for ten minutes, and for the session that started it: the address the provider
 * sends the browser back to is of no use to anyone else.
 */
@Injectable()
export class PendingConnections {
  /** Keeps the connection for the session, and gives the state that names it. */
  start(_connection: PendingConnection, _sessionToken: string): string {
    throw new Error('Not implemented yet');
  }

  /** Forgets the connection a state names, and gives it if this session was still waiting for it. */
  consume(_state: string, _sessionToken: string): PendingConnection | undefined {
    throw new Error('Not implemented yet');
  }
}
