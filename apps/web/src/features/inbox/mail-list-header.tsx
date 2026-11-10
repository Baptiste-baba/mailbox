import { Chip, SegmentedControl } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { mailboxesQuery, selectInboxUnreadCount } from '../../api/mailboxes-query.ts';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { fr } from '../../i18n/fr.ts';
import { useShortcut } from '../../use-shortcut.ts';
import { MailSearchField } from './mail-search-field.tsx';

type Filter = 'all' | 'unread';

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'all', label: fr.inbox.filterAll },
  { value: 'unread', label: fr.inbox.filterUnread },
];

/** Title of the view with its unread count, the choice between every thread and unread ones, then search. */
export function MailListHeader({ filters }: { filters: ThreadFilters }) {
  const navigate = useNavigate();
  const showUnreadOnly = (unreadOnly: boolean) =>
    navigate({ to: '.', search: (previous) => ({ ...previous, unread: unreadOnly || undefined }) });
  useShortcut('unreadOnly', () => showUnreadOnly(!filters.unreadOnly));
  const { title, unreadCount, place } = useViewSummary(filters);
  return (
    <div className="flex-none px-6 pt-7">
      <div className="flex items-center gap-3">
        <h1 className="truncate text-title font-semibold text-heading">{title}</h1>
        {unreadCount !== undefined && unreadCount > 0 && (
          <Chip tone="tint">{fr.common.unreadCount(unreadCount)}</Chip>
        )}
      </div>
      <SegmentedControl
        variant="tabs"
        label={fr.inbox.filterLabel}
        options={filterOptions}
        value={filters.unreadOnly ? 'unread' : 'all'}
        onChange={(filter) => showUnreadOnly(filter === 'unread')}
        className="mt-5"
      />
      <MailSearchField place={place} />
    </div>
  );
}

interface ViewSummary {
  title: string;
  unreadCount?: number | undefined;
  /** Where the search of the list looks, such as "la réception". */
  place: string;
}

function useViewSummary(filters: ThreadFilters): ViewSummary {
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
