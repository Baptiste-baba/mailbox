import type { Message } from '@mailbox/shared';
import { Avatar } from '@mailbox/ui';
import { formatMessageDate } from '../../dates/format-mail-date.ts';
import { fr } from '../../i18n/fr.ts';
import { MessageBody } from './message-body.tsx';
import { isOwn, recipientsLine } from './participants.ts';

/** Longest start of a text worth folding into one line: the rest would only be cut off. */
const FOLDED_LENGTH = 300;

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
  // The owner reads "Toi", but keeps the initials of their own name.
  const avatar = <Avatar name={name} size="sm" tone={own ? 'accent' : 'neutral'} />;
  const date = (
    <time dateTime={message.sentAt} className="flex-none text-caption text-ink-2">
      {formatMessageDate(message.sentAt, now)}
    </time>
  );
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
          {message.bodyText.slice(0, FOLDED_LENGTH).replace(/\s+/g, ' ').trim()}
        </span>
        {date}
      </button>
    );
  }
  return (
    // Two columns: the avatar, then everything else, so that the text lines up with the name.
    <div className="grid grid-cols-[auto_1fr] gap-x-3.5 px-4.5 pt-5 pb-5.5">
      <button
        type="button"
        aria-expanded
        onClick={onToggle}
        className="col-span-2 grid grid-cols-subgrid items-center text-left"
      >
        {avatar}
        <span className="flex min-w-0 items-start gap-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate leading-5 font-semibold">{sender}</span>
            <span className="truncate text-caption text-ink-2">
              {recipientsLine(message, ownAddress)}
            </span>
          </span>
          {date}
        </span>
      </button>
      <MessageBody message={message} />
    </div>
  );
}
