import type { MailboxSummary, Thread } from '@mailbox/shared';
import { Swatch } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { participantsLine } from './participants.ts';

interface ThreadHeaderProps {
  thread: Thread;
  mailbox: MailboxSummary | undefined;
}

/** Subject of the thread, who takes part in it and the mailbox it is in. */
export function ThreadHeader({ thread, mailbox }: ThreadHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <h2 className="text-title leading-tight font-bold break-words">
        {thread.subject || fr.inbox.noSubject}
      </h2>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-meta text-ink3">
        <span>{participantsLine(thread.messages, mailbox?.address)}</span>
        {mailbox !== undefined && (
          <span className="flex items-center gap-1.25" title={mailbox.address}>
            <Swatch color={mailbox.color} shape="circle" size="small" />
            {mailbox.name}
          </span>
        )}
      </div>
    </header>
  );
}
