import { SERVER_EVENTS_PATH, type ServerEvent, serverEventSchema } from '@mailbox/shared';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { mailboxesQuery } from './mailboxes-query.ts';
import { THREAD_PAGES_KEY } from './thread-pages-query.ts';
import { THREAD_KEY } from './thread-query.ts';

/** Whether a cached list of threads shows the mail of a mailbox: its own list, or every mailbox's. */
function listsMailbox(queryKey: readonly unknown[], mailboxId: string): boolean {
  const [key, filters] = queryKey;
  if (key !== THREAD_PAGES_KEY || typeof filters !== 'object' || filters === null) {
    return false;
  }
  // A list of every mailbox has no mailbox among its filters.
  const listed = 'mailboxId' in filters ? filters.mailboxId : undefined;
  return listed === undefined || listed === mailboxId;
}

/** Reads again, from the api, what the app shows that the event says changed. */
async function follow(queryClient: QueryClient, event: ServerEvent): Promise<void> {
  if (event.type === 'mailboxChanged') {
    await Promise.all([
      queryClient.invalidateQueries(mailboxesQuery),
      queryClient.invalidateQueries({
        predicate: (query) => listsMailbox(query.queryKey, event.mailboxId),
      }),
      queryClient.invalidateQueries({ queryKey: [THREAD_KEY] }),
    ]);
  } else if (event.type === 'resync') {
    await queryClient.invalidateQueries();
  }
}

/**
 * Keeps what the app shows in line with the server as it changes: new mail, mail read or archived
 * elsewhere, the synchronisation of a mailbox. Only what is on screen is read again at once; the
 * rest, when it shows. The browser reconnects a lost stream by itself: everything is then read
 * again, as changes may have been missed meanwhile.
 */
export function useServerEvents(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const source = new EventSource(`/api${SERVER_EVENTS_PATH}`);
    let lost = false;
    source.onmessage = (message: MessageEvent<string>) => {
      void follow(queryClient, serverEventSchema.parse(JSON.parse(message.data)));
    };
    source.onerror = () => {
      lost = true;
    };
    source.onopen = () => {
      if (lost) {
        lost = false;
        void queryClient.invalidateQueries();
      }
    };
    return () => source.close();
  }, [queryClient]);
}
