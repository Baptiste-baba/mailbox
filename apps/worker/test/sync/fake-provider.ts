import {
  AppError,
  type MailProvider,
  type ProviderAccess,
  type ProviderFolder,
  type ProviderMessage,
} from '@mailbox/shared';

/** What the fake provider gives for an access it renewed. */
const FAKE_ACCESS_TOKEN = 'the-access-token';

const unused = (): never => {
  throw new Error('Keeping a mailbox in line has no use for this');
};

/**
 * A provider holding the mails it is given, most recent first, listed two per page. It numbers
 * what changes, as Gmail does, records what is asked of it, and can be told to refuse, as a real
 * one does at times.
 */
export class FakeProvider implements MailProvider {
  mails: ProviderMessage[] = [];
  folders: ProviderFolder[] = [];
  /**
   * What happened to mails, in order: changed, or gone from the mirror. The cursor is how many
   * changes were told so far.
   */
  changes: { providerMessageId: string; gone: boolean }[] = [];
  /** Ids of the mails read, in order. */
  readIds: string[] = [];
  /** Page tokens asked for, in order. */
  pagesAsked: (string | null)[] = [];
  /** How many times an access was renewed. */
  renewals = 0;
  /** The user withdrew the access: the provider no longer renews it. */
  accessWithdrawn = false;
  /** Ids of mails whose reading fails, the provider being unreachable. */
  unreachableIds = new Set<string>();
  /** Ids of mails deleted right after a page listed them. */
  goneOnceListed = new Set<string>();
  /** Runs before each mail is read: what happens meanwhile, at the provider or in the app. */
  beforeRead: (() => Promise<void>) | undefined;
  /** Page tokens the provider no longer knows. */
  lostPages = new Set<string>();
  /** The provider no longer keeps what changed before this cursor. */
  oldestCursorKept = 0;

  authorizationUrl = unused;
  redeem = unused;
  revoke = unused;

  /** A mail arrives, or changes: it is the most recent of the mailbox, and the provider tells. */
  receive(mail: ProviderMessage): void {
    this.mails = [
      mail,
      ...this.mails.filter((held) => held.providerMessageId !== mail.providerMessageId),
    ];
    this.changes.push({ providerMessageId: mail.providerMessageId, gone: false });
  }

  /** A mail is deleted, or marked as spam: the provider no longer gives it, and tells. */
  discard(providerMessageId: string): void {
    this.mails = this.mails.filter((held) => held.providerMessageId !== providerMessageId);
    this.changes.push({ providerMessageId, gone: true });
  }

  renewAccess(): Promise<ProviderAccess> {
    this.renewals += 1;
    if (this.accessWithdrawn) {
      return Promise.reject(new AppError('MAILBOX_RECONNECTION_REQUIRED', 'Access withdrawn'));
    }
    const expiresAt = new Date(Date.now() + 3_600_000);
    return Promise.resolve({ accessToken: FAKE_ACCESS_TOKEN, expiresAt });
  }

  listMessages(_accessToken: string, pageToken: string | null) {
    this.pagesAsked.push(pageToken);
    if (pageToken !== null && this.lostPages.has(pageToken)) {
      return Promise.resolve(null);
    }
    const start = pageToken === null ? 0 : Number(pageToken);
    const end = start + 2;
    const page = {
      providerMessageIds: this.mails.slice(start, end).map((mail) => mail.providerMessageId),
      nextPageToken: end < this.mails.length ? String(end) : null,
    };
    this.mails = this.mails.filter((mail) => !this.goneOnceListed.has(mail.providerMessageId));
    return Promise.resolve(page);
  }

  async readMessage(_accessToken: string, providerMessageId: string) {
    await this.beforeRead?.();
    this.readIds.push(providerMessageId);
    if (this.unreachableIds.has(providerMessageId)) {
      throw new AppError('MAIL_PROVIDER_UNAVAILABLE', 'No answer');
    }
    return this.mails.find((held) => held.providerMessageId === providerMessageId) ?? null;
  }

  currentCursor() {
    return Promise.resolve(String(this.changes.length));
  }

  listChanges(_accessToken: string, cursor: string) {
    if (Number(cursor) < this.oldestCursorKept) {
      return Promise.resolve(null);
    }
    // The latest change of a mail says what it became.
    const latest = new Map(
      this.changes.slice(Number(cursor)).map((change) => [change.providerMessageId, change.gone]),
    );
    const told = (gone: boolean) =>
      [...latest].filter(([, isGone]) => isGone === gone).map(([id]) => id);
    return Promise.resolve({
      changedMessageIds: told(false),
      goneMessageIds: told(true),
      nextCursor: String(this.changes.length),
    });
  }

  listFolders() {
    return Promise.resolve(this.folders);
  }
}
