import { relations } from 'drizzle-orm';
import { attachment } from './attachment.ts';
import { message } from './message.ts';
import { thread } from './thread.ts';

// What lets one query read a thread with its messages and their attachments.

export const threadRelations = relations(thread, ({ many }) => ({
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  thread: one(thread, { fields: [message.threadId], references: [thread.id] }),
  attachments: many(attachment),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  message: one(message, { fields: [attachment.messageId], references: [message.id] }),
}));
