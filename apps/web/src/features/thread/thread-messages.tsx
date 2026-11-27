import type { Thread } from '@mailbox/shared';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { MessageItem } from './message-item.tsx';

interface ThreadMessagesProps {
  thread: Thread;
  ownAddress: string | undefined;
}

/**
 * The messages of a thread, oldest first, in one frame, or under a line and between lines from
 * edge to edge on a phone: only the latest is open at first.
 */
export function ThreadMessages({ thread, ownAddress }: ThreadMessagesProps) {
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
      className="divide-y divide-line rounded-lg border border-line compact:-mx-4 compact:rounded-none compact:border-x-0 compact:border-b-0"
    >
      {thread.messages.map((message) => (
        <li key={message.id}>
          <MessageItem
            message={message}
            ownAddress={ownAddress}
            open={openIds.has(message.id)}
            onToggle={() => toggle(message.id)}
            now={now}
          />
        </li>
      ))}
    </ol>
  );
}
