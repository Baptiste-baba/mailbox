import type { MailboxConnectionCompletion } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { completeMailboxConnection } from './mailbox-requests.ts';

/**
 * The end of a connection, asked of the api once and only once: a state and its code work a single
 * time, so nothing may ask again, be it a second render, a failure or the window coming back.
 */
export function mailboxConnectionQuery(completion: MailboxConnectionCompletion) {
  return queryOptions({
    queryKey: ['mailbox-connection', completion.state],
    queryFn: async ({ client }) => {
      const mailbox = await completeMailboxConnection(completion);
      // The sidebar and the settings list the new mailbox as soon as they show.
      await client.invalidateQueries(mailboxesQuery);
      return mailbox;
    },
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
