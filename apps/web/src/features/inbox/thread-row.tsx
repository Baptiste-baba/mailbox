import type { MailboxSummary, ThreadSummary, ThreadView } from '@mailbox/shared';
import { Avatar, Chip, RowLink, Swatch } from '@mailbox/ui';
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
      <Avatar name={sender} className="self-center" />
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
    // As high as the chip, with or without one, so that every card has the height of the estimate.
    <span className="mt-1.5 flex h-5 items-center gap-2 text-caption leading-none text-ink-2">
      {mailbox !== undefined && (
        <Chip tone="tint" size="sm">
          <Swatch color={mailbox.color} shape="circle" />
          {mailbox.name}
        </Chip>
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
