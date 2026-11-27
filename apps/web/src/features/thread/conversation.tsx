import type { MailboxSummary, Thread } from '@mailbox/shared';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { MailboxName } from './mailbox-name.tsx';
import { MessageItem } from './message-item.tsx';
import { participantsLine } from './participants.ts';
import { ThreadHeader } from './thread-header.tsx';

interface ConversationProps {
  thread: Thread;
  mailbox: MailboxSummary | undefined;
}

/** A thread of several messages: who takes part under the subject, then the messages, oldest first. */
export function Conversation({ thread, mailbox }: ConversationProps) {
  return (
    <>
      <ThreadHeader subject={thread.subject}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-small text-ink-2">
          <span>{participantsLine(thread.messages, mailbox?.address)}</span>
          {mailbox !== undefined && <MailboxName mailbox={mailbox} />}
        </div>
      </ThreadHeader>
      <MessageList thread={thread} ownAddress={mailbox?.address} />
    </>
  );
}

/** The messages, each set apart by a line: only the latest is open at first. */
function MessageList({ thread, ownAddress }: { thread: Thread; ownAddress: string | undefined }) {
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
    <ol aria-label={fr.thread.messagesLabel} className="divide-y divide-line">
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
