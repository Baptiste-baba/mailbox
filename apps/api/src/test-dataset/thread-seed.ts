import type { Attachment, MailAddress } from '@mailbox/shared';

/** A message of the test dataset, dated by how long before now it was sent. */
export interface MessageSeed {
  from: MailAddress;
  to: MailAddress[];
  cc?: MailAddress[];
  minutesAgo: number;
  body: string;
  attachments?: Omit<Attachment, 'id'>[];
}

/** A thread of the test dataset, its messages oldest first. */
export interface ThreadSeed {
  mailboxId: string;
  subject: string;
  unread?: boolean;
  archived?: boolean;
  messages: MessageSeed[];
}

export const minutes = (count: number): number => count;
export const hours = (count: number): number => count * 60;
export const days = (count: number): number => count * 24 * 60;
