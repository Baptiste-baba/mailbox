import { type MailboxList, type MailboxSummary, mailboxListSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

export const mailboxesQuery = queryOptions({
  queryKey: ['mailboxes'],
  queryFn: ({ signal }) => fetchApi('/mailboxes', mailboxListSchema, signal),
});

/** Unread threads in the inbox of every mailbox, as `select` of the mailboxes query. */
export function selectInboxUnreadCount({ mailboxes }: MailboxList): number {
  return mailboxes.reduce((total, mailbox) => total + mailbox.unreadCount, 0);
}

/** Each mailbox by its id, as `select` of the mailboxes query: built once per change of the data. */
export function selectMailboxesById({ mailboxes }: MailboxList): Map<string, MailboxSummary> {
  return new Map(mailboxes.map((mailbox) => [mailbox.id, mailbox]));
}
