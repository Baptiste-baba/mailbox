import { type Database, mailbox, SecretBox } from '@mailbox/db';
import { type MailProviders, requireMailProvider } from '@mailbox/providers';
import {
  AppError,
  type MailboxAuthorization,
  type MailboxConnectionCompletion,
  type MailboxConnectionRequest,
  type MailboxSummary,
  type MailProviderList,
  type MailProviderName,
  mailboxConnectionFailure,
  type ProviderGrant,
} from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { CONNECTION_REDIRECT_URI } from './connection-redirect-uri.ts';
import { MAIL_PROVIDERS } from './mail-providers.ts';
import { mailboxNotFound } from './mailbox-not-found.ts';
import { MailboxesService } from './mailboxes.service.ts';
import { type ConnectionTarget, PendingConnections } from './pending-connections.ts';
import { codeChallengeOf, createCodeVerifier } from './pkce.ts';

type NewMailbox = Extract<ConnectionTarget, { kind: 'newMailbox' }>;

/**
 * Connecting a mailbox: the user signs in at the provider, which sends them back with a code, and
 * the code gives the token that reads their mail from then on.
 */
@Injectable()
export class MailboxConnectionService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @Inject(MAIL_PROVIDERS) private readonly mailProviders: MailProviders,
    @Inject(CONNECTION_REDIRECT_URI) private readonly redirectUri: string,
    private readonly mailboxes: MailboxesService,
    private readonly pendingConnections: PendingConnections,
    private readonly secretBox: SecretBox,
  ) {}

  /** The providers a mailbox can be added from on this server. */
  providers(): MailProviderList {
    return { providers: [...this.mailProviders.keys()] };
  }

  /**
   * Starts adding a mailbox.
   * @param sessionToken The session adding the mailbox: only it may finish the connection.
   * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
   */
  start(request: MailboxConnectionRequest, sessionToken: string): MailboxAuthorization {
    const target: NewMailbox = { kind: 'newMailbox', name: request.name, color: request.color };
    return this.authorization(request.provider, target, sessionToken);
  }

  /**
   * Starts signing in again to a mailbox whose provider no longer accepts the stored token.
   * @param sessionToken The session reconnecting the mailbox: only it may finish the connection.
   * @throws AppError MAILBOX_NOT_FOUND
   * @throws AppError MAIL_PROVIDER_NOT_CONFIGURED
   */
  async startReconnection(mailboxId: string, sessionToken: string): Promise<MailboxAuthorization> {
    const [stored] = await this.database
      .select({ provider: mailbox.provider, address: mailbox.address })
      .from(mailbox)
      .where(eq(mailbox.id, mailboxId));
    if (stored === undefined) {
      throw mailboxNotFound(mailboxId);
    }
    const target: ConnectionTarget = { kind: 'reconnection', mailboxId };
    return this.authorization(stored.provider, target, sessionToken, stored.address);
  }

  /**
   * Finishes a connection with what the provider sent the browser back with, and stores the token
   * encrypted. An address already connected gets its access back and keeps its name and colour.
   * @throws AppError MAILBOX_CONNECTION_FAILED when this session was not waiting for that state,
   * or when the provider refuses the code.
   * @throws AppError MAILBOX_ACCOUNT_MISMATCH when a mailbox being reconnected and the account the
   * user signed in with are not the same.
   * @throws AppError MAILBOX_NOT_FOUND when the mailbox being reconnected was removed meanwhile.
   * @throws AppError MAIL_PROVIDER_UNAVAILABLE
   */
  async complete(
    { state, code }: MailboxConnectionCompletion,
    sessionToken: string,
  ): Promise<MailboxSummary> {
    const pending = this.pendingConnections.consume(state, sessionToken);
    if (pending === undefined) {
      throw mailboxConnectionFailure(
        'connectionExpired',
        'No connection is waiting for this state',
      );
    }
    const { provider, codeVerifier, target } = pending;
    const grant = await requireMailProvider(this.mailProviders, provider).redeem({
      code,
      codeVerifier,
      redirectUri: this.redirectUri,
    });
    const mailboxId =
      target.kind === 'newMailbox'
        ? await this.connect(provider, target, grant)
        : await this.reconnect(target.mailboxId, grant);
    return this.mailboxes.get(mailboxId);
  }

  private authorization(
    providerName: MailProviderName,
    target: ConnectionTarget,
    sessionToken: string,
    loginHint?: string,
  ): MailboxAuthorization {
    const provider = requireMailProvider(this.mailProviders, providerName);
    const codeVerifier = createCodeVerifier();
    const state = this.pendingConnections.start(
      { provider: providerName, codeVerifier, target },
      sessionToken,
    );
    const authorizationUrl = provider.authorizationUrl({
      state,
      codeChallenge: codeChallengeOf(codeVerifier),
      redirectUri: this.redirectUri,
      ...(loginHint === undefined ? {} : { loginHint }),
    });
    return { authorizationUrl };
  }

  private async connect(
    provider: MailProviderName,
    { name, color }: NewMailbox,
    grant: ProviderGrant,
  ): Promise<string> {
    const refreshTokenEncrypted = this.secretBox.seal(grant.refreshToken);
    const [stored] = await this.database
      .insert(mailbox)
      .values({ provider, address: grant.address, name, color, refreshTokenEncrypted })
      .onConflictDoUpdate({
        target: [mailbox.provider, mailbox.address],
        set: { refreshTokenEncrypted, status: 'connected' },
      })
      .returning({ id: mailbox.id });
    if (stored === undefined) {
      throw new Error('Storing the mailbox returned no row');
    }
    return stored.id;
  }

  private async reconnect(mailboxId: string, grant: ProviderGrant): Promise<string> {
    const [stored] = await this.database
      .select({ address: mailbox.address })
      .from(mailbox)
      .where(eq(mailbox.id, mailboxId));
    if (stored === undefined) {
      throw mailboxNotFound(mailboxId);
    }
    if (stored.address !== grant.address) {
      throw new AppError(
        'MAILBOX_ACCOUNT_MISMATCH',
        'The account signed in with is not the one of the mailbox',
        { details: { mailboxId } },
      );
    }
    await this.database
      .update(mailbox)
      .set({ refreshTokenEncrypted: this.secretBox.seal(grant.refreshToken), status: 'connected' })
      .where(eq(mailbox.id, mailboxId));
    return mailboxId;
  }
}
