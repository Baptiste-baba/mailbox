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
      <span
        className={`mt-3 size-1.5 flex-none rounded-full ${thread.unread ? 'bg-klein' : 'bg-transparent'}`}
      />
      <Avatar name={sender} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline gap-2">
          <span className={`truncate ${thread.unread ? 'font-semibold' : 'font-medium'}`}>
            {sender}
          </span>
          <time dateTime={thread.lastMessageAt} className="ml-auto flex-none text-meta text-ink3">
            {formatListDate(thread.lastMessageAt, now)}
          </time>
        </span>
        <span className="truncate">{thread.subject || fr.inbox.noSubject}</span>
        <span className="truncate text-ink3">{thread.snippet}</span>
        <span className="flex items-center gap-2.5 pt-0.75 text-label text-ink3">
          {mailbox !== undefined && (
            <span className="flex items-center gap-1.25">
              <Swatch color={mailbox.color} shape="circle" small />
              {mailbox.name}
            </span>
          )}
          {thread.hasAttachments && (
            <span className="flex items-center">
              <PaperclipIcon className="icon-12" />
              <span className="sr-only">{fr.inbox.hasAttachments}</span>
            </span>
          )}
        </span>
      </span>
    </ThreadRowLink>
  );
}
