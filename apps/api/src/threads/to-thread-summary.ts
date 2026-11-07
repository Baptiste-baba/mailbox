import type { ThreadSummary } from '@mailbox/shared';
import type { TestThread } from '../test-dataset/test-dataset.ts';

const SNIPPET_MAX_LENGTH = 200;

export function toThreadSummary(thread: TestThread): ThreadSummary {
  const lastMessage = thread.messages[thread.messages.length - 1];
  if (lastMessage === undefined) {
    throw new Error(`Thread ${thread.id} has no message`);
  }
  return {
    id: thread.id,
    mailboxId: thread.mailboxId,
    subject: thread.subject,
    sender: lastMessage.from,
    snippet: lastMessage.bodyText.replace(/\s+/g, ' ').trim().slice(0, SNIPPET_MAX_LENGTH),
    lastMessageAt: lastMessage.sentAt,
    unread: thread.unread,
    messageCount: thread.messages.length,
    hasAttachments: thread.messages.some((message) => message.attachments.length > 0),
  };
}
