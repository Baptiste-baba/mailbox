import type { Message } from '@mailbox/shared';
import { MessageBody } from './message-body.tsx';
import { FoldedMessageHeading, MessageHeading } from './message-heading.tsx';

interface MessageItemProps {
  message: Message;
  ownAddress: string | undefined;
  open: boolean;
  onToggle: () => void;
  now: Date;
}

/** One message of a conversation: folded to a line with its start, or open on its whole body. */
export function MessageItem({ message, ownAddress, open, onToggle, now }: MessageItemProps) {
  return (
    <div className={open ? 'flex flex-col gap-2 pb-6' : undefined}>
      {/* Both states keep the same button, which would otherwise take the keyboard focus away with it. */}
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full py-4 text-left"
      >
        {open ? (
          <MessageHeading message={message} ownAddress={ownAddress} now={now} />
        ) : (
          <FoldedMessageHeading message={message} ownAddress={ownAddress} now={now} />
        )}
      </button>
      {open && <MessageBody message={message} />}
    </div>
  );
}
