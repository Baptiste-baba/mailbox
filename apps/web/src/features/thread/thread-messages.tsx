import type { Thread } from '@mailbox/shared';
import { type ReactNode, useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { MessageCard } from './message-card.tsx';

interface ThreadMessagesProps {
  thread: Thread;
  ownAddress: string | undefined;
  /** The way to reply, at the foot of the latest message. */
  reply: ReactNode;
}

/**
 * The messages of a thread, oldest first, on a rail: only the latest is open at first, and it stretches
 * to the bottom of the pane, with the reply at its foot.
 */
export function ThreadMessages({ thread, ownAddress, reply }: ThreadMessagesProps) {
  const [openIds, setOpenIds] = useState(() => new Set([thread.messages.at(-1)?.id]));
  const toggle = (messageId: string) =>
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (!next.delete(messageId)) {
        next.add(messageId);
      }
      return next;
    });
  const now = new Date();
  return (
    <ol
      aria-label={fr.thread.messagesLabel}
      // The rail runs through the centre of the avatars, visible in the gaps between the cards.
      className="relative flex flex-1 flex-col gap-2.5 before:absolute before:top-6 before:bottom-6 before:left-7.75 before:w-px before:bg-frost2"
    >
      {thread.messages.map((message, position) => {
        const latest = position === thread.messages.length - 1;
        return (
          <li
            key={message.id}
            className={latest ? 'relative flex flex-1 flex-col' : 'relative flex flex-col'}
          >
            <MessageCard
              message={message}
              ownAddress={ownAddress}
              open={openIds.has(message.id)}
              onToggle={() => toggle(message.id)}
              now={now}
              footer={latest ? reply : undefined}
            />
          </li>
        );
      })}
    </ol>
  );
}
