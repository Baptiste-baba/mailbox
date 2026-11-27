import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import type { ThreadFilters } from '../../api/thread-pages-query.ts';
import { fr } from '../../i18n/fr.ts';
import { ThreadListMessage } from './thread-list-states.tsx';

/**
 * What a list without a thread says: no mailbox to read from yet, its mails still being copied, or
 * nothing to read here.
 */
export function EmptyThreadList({ filters }: { filters: ThreadFilters }) {
  const mailboxes = useQuery(mailboxesQuery).data?.mailboxes;
  const navigate = useNavigate();
  if (mailboxes?.length === 0) {
    return (
      <ThreadListMessage
        message={fr.inbox.noMailbox}
        action={{ label: fr.inbox.connectMailbox, onClick: () => navigate({ to: '/settings' }) }}
      />
    );
  }
  const listed = mailboxes?.filter(
    (mailbox) => filters.mailboxId === undefined || mailbox.id === filters.mailboxId,
  );
  if (listed?.some((mailbox) => mailbox.sync.state === 'copying') === true) {
    return <ThreadListMessage message={fr.inbox.copying} />;
  }
  return <ThreadListMessage message={filters.unreadOnly ? fr.inbox.emptyUnread : fr.inbox.empty} />;
}
