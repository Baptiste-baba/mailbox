import type { MailAddress } from './mail-address.ts';

/** What a mail says of a file it carries. The file itself stays at the provider. */
export interface ProviderAttachment {
  fileName: string;
  mimeType: string;
  /** Size in bytes. */
  size: number;
  /** What the HTML body calls the file when it displays it; null for a file merely attached. */
  contentId: string | null;
}

/**
 * A mail as every provider gives it to the rest of the app, whatever its own format. Its content
 * comes from whoever wrote the mail: nothing in it can be trusted.
 */
export interface ProviderMessage {
  providerMessageId: string;
  /** The conversation the provider files the mail in. */
  providerThreadId: string;
  /** Empty when the mail has none. */
  subject: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  /** When the provider received the mail: the date the mail gives itself can say anything. */
  sentAt: Date;
  /** Start of the mail, as plain text. */
  snippet: string;
  /** A mail carries a plain text body, an HTML one, or both. */
  bodyText: string | null;
  bodyHtml: string | null;
  unread: boolean;
  inInbox: boolean;
  /** The folders of the user the mail is filed in, by their id at the provider. */
  providerFolderIds: string[];
  /** In the order the mail carries them. */
  attachments: ProviderAttachment[];
}

/** Some of the mails of an account, by their id at the provider, most recent first. */
export interface ProviderMessagePage {
  providerMessageIds: string[];
  /** What asks for the mails that follow; null once there is none left. */
  nextPageToken: string | null;
}

/** What changed in the mailbox of an account since a cursor was given. */
export interface ProviderChanges {
  /**
   * The mails that arrived, or changed in a way the mirror shows (read or not, archived, filed),
   * by their id at the provider: each is read again to know what it became.
   */
  changedMessageIds: string[];
  /**
   * The mails the mirror no longer holds: deleted at the provider, or now spam, deleted mail or a
   * draft. They are removed without being read.
   */
  goneMessageIds: string[];
  /** What asks for the changes that follow these. */
  nextCursor: string;
}

/** A folder the user created at the provider, where it may be called a label. */
export interface ProviderFolder {
  providerFolderId: string;
  name: string;
}
