import { useQuery } from '@tanstack/react-query';
import { mailboxesQuery, selectInboxUnreadCount } from '../../api/mailboxes-query.ts';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { fr } from '../../i18n/fr.ts';

interface ViewSummary {
  title: string;
  unreadCount?: number | undefined;
  /** Where the search of the list looks, such as "la réception". */
  place: string;
}

/** What the list shows: its title, how many of its threads are unread, where its search looks. */
export function useViewSummary(filters: ThreadFilters): ViewSummary {
  const mailboxes = useQuery(mailboxesQuery).data?.mailboxes;
  if (filters.view === 'all') {
    return { title: fr.sidebar.allMailboxes, place: fr.inbox.allMailboxesPlace };
  }
  const mailbox = mailboxes?.find((candidate) => candidate.id === filters.mailboxId);
  if (mailbox !== undefined) {
    return { title: mailbox.name, unreadCount: mailbox.unreadCount, place: mailbox.name };
  }
  return {
    title: fr.sidebar.inbox,
    unreadCount: mailboxes && selectInboxUnreadCount({ mailboxes }),
    place: fr.inbox.inboxPlace,
  };
}
