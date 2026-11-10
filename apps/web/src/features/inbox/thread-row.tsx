import type { MailboxSummary, ThreadSummary, ThreadView } from '@mailbox/shared';
import { Avatar, RowLink, Swatch } from '@mailbox/ui';
import { createLink } from '@tanstack/react-router';
import { PaperclipIcon } from 'lucide-react';
import { formatListDate } from '../../dates/format-mail-date.ts';
import { fr } from '../../i18n/fr.ts';

const ThreadRowLink = createLink(RowLink);

interface ThreadRowProps {
  thread: ThreadSummary;
  view: ThreadView;
  mailbox: MailboxSummary | undefined;
  now: Date;
}

/** One thread of the list: who wrote last, when, the subject and the start of the latest message. */
export function ThreadRow({ thread, view, mailbox, now }: ThreadRowProps) {
  const sender = thread.sender.name || thread.sender.address;
  return (
    <ThreadRowLink to="/$view/$id" params={{ view, id: thread.id }} search={(previous) => previous}>
      <Avatar name={sender} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-2">
          <span className={`truncate ${thread.unread ? 'font-semibold' : 'font-medium'}`}>
            {sender}
          </span>
          <time
            dateTime={thread.lastMessageAt}
            className="ml-auto flex-none text-caption text-ink-2"
          >
            {formatListDate(thread.lastMessageAt, now)}
          </time>
        </span>
        <span className="flex items-center gap-2">
          <span className={`truncate ${thread.unread ? 'font-semibold' : ''}`}>
            {thread.subject || fr.inbox.noSubject}
          </span>
          {thread.unread && (
            <span aria-hidden="true" className="ml-auto size-2 flex-none rounded-full bg-primary" />
          )}
        </span>
        <span className="truncate text-small text-ink-2">{thread.snippet}</span>
        <ThreadRowMeta mailbox={mailbox} hasAttachments={thread.hasAttachments} />
      </span>
    </ThreadRowLink>
  );
}

function ThreadRowMeta({
  mailbox,
  hasAttachments,
}: {
  mailbox: MailboxSummary | undefined;
  hasAttachments: boolean;
}) {
  return (
    <span className="mt-2 flex items-center gap-2 text-caption leading-none text-ink-2">
      {mailbox !== undefined && (
        <span className="flex items-center gap-2">
          <Swatch color={mailbox.color} shape="circle" />
          {mailbox.name}
        </span>
      )}
      {hasAttachments && (
        <span className="flex items-center">
          <PaperclipIcon className="icon-14" />
          <span className="sr-only">{fr.inbox.hasAttachments}</span>
        </span>
      )}
    </span>
  );
}
