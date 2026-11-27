import {
  AppError,
  type MailProvider,
  type ProviderFolder,
  type ProviderMessage,
} from '@mailbox/shared';

/** What the fake provider gives for an access it renewed. */
export const FAKE_ACCESS_TOKEN = 'the-access-token';

const unused = (): never => {
  throw new Error('The copy of a mailbox has no use for this');
};

/**
 * A provider holding the mails it is given, most recent first, listed two per page. It records
 * what the copy reads, and can be told to refuse, as a real one does at times.
 */
export class FakeProvider implements MailProvider {
  mails: ProviderMessage[] = [];
  folders: ProviderFolder[] = [];
  /** Ids of the mails read, in order. */
  readIds: string[] = [];
  /** Page tokens asked for, in order. */
  pagesAsked: (string | null)[] = [];
  /** The user withdrew the access: the provider no longer renews it. */
  accessWithdrawn = false;
  /** Ids of mails listed, then deleted before they are read. */
  deletedIds = new Set<string>();
  /** Ids of mails whose reading fails, the provider being unreachable. */
  unreachableIds = new Set<string>();
  /** Page tokens the provider no longer knows. */
  lostPages = new Set<string>();

  authorizationUrl = unused;
  redeem = unused;
  revoke = unused;

  renewAccess(): Promise<{ accessToken: string; expiresAt: Date }> {
    if (this.accessWithdrawn) {
      return Promise.reject(new AppError('MAILBOX_RECONNECTION_REQUIRED', 'Access withdrawn'));
    }
    return Promise.resolve({
      accessToken: FAKE_ACCESS_TOKEN,
      expiresAt: new Date(Date.now() + 3_600_000),
    });
  }

  listMessages(_accessToken: string, pageToken: string | null) {
    this.pagesAsked.push(pageToken);
    if (pageToken !== null && this.lostPages.has(pageToken)) {
      return Promise.resolve(null);
    }
    const start = pageToken === null ? 0 : Number(pageToken);
    const end = start + 2;
    return Promise.resolve({
      providerMessageIds: this.mails.slice(start, end).map((mail) => mail.providerMessageId),
      nextPageToken: end < this.mails.length ? String(end) : null,
    });
  }

  readMessage(_accessToken: string, providerMessageId: string) {
    this.readIds.push(providerMessageId);
    if (this.unreachableIds.has(providerMessageId)) {
      return Promise.reject(new AppError('MAIL_PROVIDER_UNAVAILABLE', 'No answer'));
    }
    const mail = this.mails.find((candidate) => candidate.providerMessageId === providerMessageId);
    return Promise.resolve(
      mail === undefined || this.deletedIds.has(providerMessageId) ? null : mail,
    );
  }

  listFolders() {
    return Promise.resolve(this.folders);
  }
}
