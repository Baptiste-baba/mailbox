import type { Message } from '@mailbox/shared';
import { Avatar } from '@mailbox/ui';
import { formatMessageDate } from '../../dates/format-mail-date.ts';
import { fr } from '../../i18n/fr.ts';
import { MessageBody } from './message-body.tsx';
import { isOwn, recipientsLine } from './participants.ts';

interface MessageItemProps {
  message: Message;
  ownAddress: string | undefined;
  open: boolean;
  onToggle: () => void;
  now: Date;
}

/** One message of a thread: folded to a line with its start, or open on its whole text. */
export function MessageItem({ message, ownAddress, open, onToggle, now }: MessageItemProps) {
  const own = isOwn(message.from, ownAddress);
  const name = message.from.name || message.from.address;
  const sender = own ? fr.thread.me : name;
  const date = (
    <time dateTime={message.sentAt} className="flex-none text-caption text-ink-2">
      {formatMessageDate(message.sentAt, now)}
    </time>
  );
  // The owner reads "Toi", but keeps the initials of their own name.
  const avatar = <Avatar name={name} size="sm" tone={own ? 'accent' : 'neutral'} />;
  if (!open) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 px-4.5 py-3.5 text-left"
      >
        {avatar}
        <span className="flex-none font-semibold">{sender}</span>
        <span className="min-w-0 flex-1 truncate text-small text-ink-2">
          {message.bodyText.replace(/\s+/g, ' ').trim()}
        </span>
        {date}
      </button>
    );
  }
  return (
    <div className="px-4.5 pt-5 pb-5.5">
      <button
        type="button"
        aria-expanded
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 text-left"
      >
        {avatar}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate leading-5 font-semibold">{sender}</span>
          <span className="truncate text-caption text-ink-2">
            {recipientsLine(message, ownAddress)}
          </span>
        </span>
        <span className="self-start">{date}</span>
      </button>
      <MessageBody message={message} />
    </div>
  );
}
