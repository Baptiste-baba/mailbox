import { IconButton, PaneHeader } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CircleSmallIcon, PanelRightIcon } from 'lucide-react';
import { mailboxesQuery, selectInboxUnreadCount } from '../../api/mailboxes-query.ts';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { comingSoonHint } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';
import { useShortcut } from '../../use-shortcut.ts';

/** Title of the view with its unread count, then the actions on the list. */
export function MailListHeader({ filters }: { filters: ThreadFilters }) {
  const navigate = useNavigate();
  const toggleUnreadOnly = () =>
    navigate({
      to: '.',
      search: (previous) => ({ ...previous, unread: previous.unread ? undefined : true }),
    });
  useShortcut('unreadOnly', toggleUnreadOnly);
  const { title, unreadCount } = useViewSummary(filters);
  return (
    <PaneHeader className="gap-2 pr-3 pl-4.5">
      <h1 className="truncate text-heading font-bold">{title}</h1>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="flex-none text-caption text-ink-2">
          {fr.common.unreadCount(unreadCount)}
        </span>
      )}
      <div className="ml-auto flex gap-0.5">
        <IconButton
          label={fr.inbox.unreadOnly}
          shortcut={shortcuts.unreadOnly.label}
          pressed={filters.unreadOnly}
          onClick={toggleUnreadOnly}
        >
          <CircleSmallIcon />
        </IconButton>
        <IconButton label={comingSoonHint(fr.inbox.layout)} disabled>
          <PanelRightIcon />
        </IconButton>
      </div>
    </PaneHeader>
  );
}

function useViewSummary(filters: ThreadFilters): {
  title: string;
  unreadCount?: number | undefined;
} {
  const mailboxes = useQuery(mailboxesQuery).data?.mailboxes;
  if (filters.view === 'all') {
    return { title: fr.sidebar.allMailboxes };
  }
  const mailbox = mailboxes?.find((candidate) => candidate.id === filters.mailboxId);
  if (mailbox !== undefined) {
    return { title: mailbox.name, unreadCount: mailbox.unreadCount };
  }
  return {
    title: fr.sidebar.inbox,
    unreadCount: mailboxes && selectInboxUnreadCount({ mailboxes }),
  };
}
