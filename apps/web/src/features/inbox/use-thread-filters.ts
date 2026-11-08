import { getRouteApi } from '@tanstack/react-router';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';

const viewRoute = getRouteApi('/_shell/$view');

/** The threads the current address asks for: its view, mailbox and unread filter. */
export function useThreadFilters(): ThreadFilters {
  const { view } = viewRoute.useParams();
  const { mailbox, unread } = viewRoute.useSearch();
  return { view, mailboxId: view === 'inbox' ? mailbox : undefined, unreadOnly: unread === true };
}
