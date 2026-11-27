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

const FIRST_REOPENING_DELAY_MS = 1000;
const LONGEST_REOPENING_DELAY_MS = 30_000;

/**
 * Listens to the server events, on a stream opened again whenever it is lost; everything is then
 * read again, as changes may have been missed meanwhile. Gives what stops listening.
 */
function listenToServerEvents(queryClient: QueryClient): () => void {
  let source: EventSource | undefined;
  let reopening: ReturnType<typeof setTimeout> | undefined;
  let delayMs = FIRST_REOPENING_DELAY_MS;
  let lost = false;
  const open = () => {
    const opened = new EventSource(`/api${SERVER_EVENTS_PATH}`);
    source = opened;
    opened.onmessage = (message: MessageEvent<string>) => {
      void follow(queryClient, serverEventSchema.parse(JSON.parse(message.data)));
    };
    // The browser opens a stream lost to the network again by itself, but gives up on an answer
    // that is no stream, such as the 502 of a proxy while the api restarts: a new one then opens.
    opened.onerror = () => {
      lost = true;
      if (opened.readyState === EventSource.CLOSED) {
        reopening = setTimeout(open, delayMs);
        delayMs = Math.min(delayMs * 2, LONGEST_REOPENING_DELAY_MS);
      }
    };
    opened.onopen = () => {
      delayMs = FIRST_REOPENING_DELAY_MS;
      if (lost) {
        lost = false;
        void queryClient.invalidateQueries();
      }
    };
  };
  open();
  return () => {
    clearTimeout(reopening);
    source?.close();
  };
}

/**
 * Keeps what the app shows in line with the server as it changes: new mail, mail read or archived
 * elsewhere, the synchronisation of a mailbox. Only what is on screen is read again at once; the
 * rest, when it shows.
 */
export function useServerEvents(): void {
  const queryClient = useQueryClient();
  useEffect(() => listenToServerEvents(queryClient), [queryClient]);
}
