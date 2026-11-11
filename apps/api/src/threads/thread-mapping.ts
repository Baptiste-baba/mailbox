import type { thread } from '@mailbox/db';
import type { Thread, ThreadSummary } from '@mailbox/shared';
import type { StoredThreadWithMessages } from './find-thread-with-messages.ts';

export function toThreadSummary(stored: typeof thread.$inferSelect): ThreadSummary {
  return {
    id: stored.id,
    mailboxId: stored.mailboxId,
    subject: stored.subject,
    sender: { name: stored.senderName, address: stored.senderAddress },
    snippet: stored.snippet,
    lastMessageAt: stored.lastMessageAt.toISOString(),
    unread: stored.unread,
    messageCount: stored.messageCount,
    hasAttachments: stored.hasAttachments,
  };
}

export function toThread(stored: StoredThreadWithMessages): Thread {
  return {
    id: stored.id,
    mailboxId: stored.mailboxId,
    subject: stored.subject,
    messages: stored.messages.map((message) => ({
      id: message.id,
      from: { name: message.fromName, address: message.fromAddress },
      to: message.toRecipients,
      cc: message.ccRecipients,
      sentAt: message.sentAt.toISOString(),
      // A mail may have no plain text body, only an HTML one.
      bodyText: message.bodyText ?? '',
      attachments: message.attachments,
    })),
  };
}
