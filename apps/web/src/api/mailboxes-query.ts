import { type MailboxList, mailboxListSchema } from '@mailbox/shared';
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
