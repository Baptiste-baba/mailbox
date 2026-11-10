import type { Message } from '@mailbox/shared';
import { Avatar, Card } from '@mailbox/ui';
import type { ReactNode } from 'react';
import { formatMessageDate } from '../../dates/format-mail-date.ts';
import { fr } from '../../i18n/fr.ts';
import { MessageBody } from './message-body.tsx';
import { isOwn, recipientsLine } from './participants.ts';

interface MessageCardProps {
  message: Message;
  ownAddress: string | undefined;
  open: boolean;
  onToggle: () => void;
  now: Date;
  /** Bottom of the card, kept in view while the message scrolls: the reply to the latest message. */
  footer?: ReactNode;
}

/** One message of a thread: folded to its first line, or open on its whole text. */
export function MessageCard({
  message,
  ownAddress,
  open,
  onToggle,
  now,
  footer,
}: MessageCardProps) {
  const own = isOwn(message.from, ownAddress);
  const name = message.from.name || message.from.address;
  const sender = own ? fr.thread.me : name;
  return (
    <Card className="flex flex-1 flex-col">
      <div className={`flex flex-1 gap-3 ${open ? 'pt-5 pr-6 pb-6 pl-5' : 'px-4 py-3.5'}`}>
        {/* The owner reads "Toi", but keeps the initials of their own name. */}
        <Avatar name={name} tone={own ? 'accent' : 'neutral'} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <button
            type="button"
            aria-expanded={open}
            onClick={onToggle}
            className="flex min-w-0 flex-col gap-0.75 rounded-sm text-left"
          >
            <span className="flex items-baseline gap-2.5">
              <span className="truncate font-semibold">{sender}</span>
              {open && (
                <span className="truncate text-caption text-ink-2">
                  {recipientsLine(message, ownAddress)}
                </span>
              )}
              <time dateTime={message.sentAt} className="ml-auto flex-none text-caption text-ink-2">
                {formatMessageDate(message.sentAt, now)}
              </time>
            </span>
            {!open && (
              <span className="truncate text-ink-2">
                {message.bodyText.replace(/\s+/g, ' ').trim()}
              </span>
            )}
          </button>
          {open && <MessageBody message={message} />}
        </div>
      </div>
      {footer !== undefined && (
        <div className="sticky bottom-0 rounded-b-xl bg-surface px-5 pt-3 pb-4 border-t border-line">
          {footer}
        </div>
      )}
    </Card>
  );
}
