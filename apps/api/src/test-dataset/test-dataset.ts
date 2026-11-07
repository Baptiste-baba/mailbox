import type { FolderSummary, MailboxSummary, Thread } from '@mailbox/shared';

/** A thread as a provider would describe it: its messages, read state and place. */
export interface TestThread extends Thread {
  unread: boolean;
  /** False once archived: the thread then only shows among all mails. */
  inInbox: boolean;
}

/** Fictitious mail served until synchronisation exists. */
export interface TestDataset {
  mailboxes: Omit<MailboxSummary, 'unreadCount'>[];
  folders: FolderSummary[];
  threads: TestThread[];
}
