import type { Message } from '@mailbox/shared';
import { Avatar } from '@mailbox/ui';
import type { ReactNode } from 'react';
import { formatMessageDate } from '../../dates/format-mail-date.ts';
import { displayName } from '../../display-name.ts';
import { fr } from '../../i18n/fr.ts';
import { isOwn, recipientsLine } from './participants.ts';

/** Longest start of a text worth folding into one line: the rest would only be cut off. */
const FOLDED_LENGTH = 300;

interface MessageHeadingProps {
  message: Message;
  ownAddress: string | undefined;
  now: Date;
}

// The owner reads "Toi", but keeps the initials of their own name.
function SenderAvatar({ message, ownAddress }: Omit<MessageHeadingProps, 'now'>) {
  const own = isOwn(message.from, ownAddress);
  return <Avatar name={displayName(message.from)} size="sm" tone={own ? 'accent' : 'neutral'} />;
}

function senderName(message: Message, ownAddress: string | undefined): string {
  return isOwn(message.from, ownAddress) ? fr.thread.me : displayName(message.from);
}

function MessageDate({ message, now }: Omit<MessageHeadingProps, 'ownAddress'>) {
  return (
    <time dateTime={message.sentAt} className="flex-none text-caption text-ink-2">
      {formatMessageDate(message.sentAt, now)}
    </time>
  );
}

/**
 * Who sent a message, who it went to and when, beside the avatar of the sender. What is given
 * follows who it went to, such as the mailbox it is in. Spans alone, to fit in a button.
 */
export function MessageHeading({
  message,
  ownAddress,
  now,
  children,
}: MessageHeadingProps & { children?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3.5">
      <SenderAvatar message={message} ownAddress={ownAddress} />
      <span className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate leading-5 font-semibold">
            {senderName(message, ownAddress)}
          </span>
          <span className="flex min-w-0 items-center gap-2.5 text-caption text-ink-2">
            <span className="truncate">{recipientsLine(message, ownAddress)}</span>
            {children}
          </span>
        </span>
        <MessageDate message={message} now={now} />
      </span>
    </span>
  );
}

/** A folded message on one line: who sent it, the start of its text and when. Spans alone. */
export function FoldedMessageHeading({ message, ownAddress, now }: MessageHeadingProps) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3.5">
      <SenderAvatar message={message} ownAddress={ownAddress} />
      <span className="flex-none font-semibold">{senderName(message, ownAddress)}</span>
      <span className="min-w-0 flex-1 truncate text-small text-ink-2">
        {message.bodyText.slice(0, FOLDED_LENGTH).replace(/\s+/g, ' ').trim()}
      </span>
      <MessageDate message={message} now={now} />
    </span>
  );
}
