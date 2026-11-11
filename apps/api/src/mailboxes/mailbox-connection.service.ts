import type {
  MailboxAuthorization,
  MailboxConnectionCompletion,
  MailboxConnectionRequest,
  MailboxSummary,
  MailProviderList,
} from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

// Fictitious answers, of the shape of the real ones, until the connection itself is written.
const FICTITIOUS_AUTHORIZATION: MailboxAuthorization = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=fictitious',
};
const FICTITIOUS_MAILBOX: MailboxSummary = {
  id: '0b8f1a52-6c1d-4f0e-9d59-3a3f2a8f4c11',
  provider: 'gmail',
  name: 'Perso',
  address: 'alex.martin@example.com',
  color: 'navy',
  unreadCount: 0,
  status: 'connected',
};

/**
 * Connecting a mailbox: the user signs in at the provider, which sends them back with a code, and
 * the code gives the token that reads their mail from then on.
 */
@Injectable()
export class MailboxConnectionService {
  /** The providers a mailbox can be added from on this server. */
  providers(): MailProviderList {
    return { providers: ['gmail'] };
  }

  /**
   * Starts adding a mailbox.
   * @param sessionToken The session adding the mailbox: only it may finish the connection.
   * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
   */
  start(_request: MailboxConnectionRequest, _sessionToken: string): MailboxAuthorization {
    return FICTITIOUS_AUTHORIZATION;
  }

  /**
   * Starts signing in again to a mailbox whose provider no longer accepts the stored token.
   * @param sessionToken The session reconnecting the mailbox: only it may finish the connection.
   * @throws AppError MAILBOX_NOT_FOUND
   * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
   */
  startReconnection(_mailboxId: string, _sessionToken: string): Promise<MailboxAuthorization> {
    return Promise.resolve(FICTITIOUS_AUTHORIZATION);
  }

  /**
   * Finishes a connection with what the provider sent the browser back with, and stores the token
   * encrypted. An address already connected gets its access back and keeps its name and colour.
   * @throws AppError MAILBOX_CONNECTION_FAILED when this session was not waiting for that state,
   * or when the provider refuses the code.
   * @throws AppError MAILBOX_ACCOUNT_MISMATCH when a mailbox being reconnected and the account the
   * user signed in with are not the same.
   * @throws AppError MAIL_PROVIDER_UNAVAILABLE
   */
  complete(
    _completion: MailboxConnectionCompletion,
    _sessionToken: string,
  ): Promise<MailboxSummary> {
    return Promise.resolve(FICTITIOUS_MAILBOX);
  }

  /** Removes a mailbox with the mail mirrored from it. Removing one already gone changes nothing. */
  remove(_mailboxId: string): Promise<void> {
    return Promise.resolve();
  }
}
