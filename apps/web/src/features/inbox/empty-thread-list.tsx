import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { fr } from '../../i18n/fr.ts';
import { ThreadListMessage } from './thread-list-states.tsx';

/** What a list without a thread says: nothing to read here, or no mailbox to read from yet. */
export function EmptyThreadList({ unreadOnly }: { unreadOnly: boolean }) {
  const mailboxes = useQuery(mailboxesQuery);
  const navigate = useNavigate();
  if (mailboxes.data?.mailboxes.length === 0) {
    return (
      <ThreadListMessage
        message={fr.inbox.noMailbox}
        action={{ label: fr.inbox.connectMailbox, onClick: () => navigate({ to: '/settings' }) }}
      />
    );
  }
  return <ThreadListMessage message={unreadOnly ? fr.inbox.emptyUnread : fr.inbox.empty} />;
}
