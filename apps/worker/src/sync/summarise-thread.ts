import { attachment, message, type Transaction, thread } from '@mailbox/db';
import { and, asc, count, desc, eq, isNull, type SQL, sql } from 'drizzle-orm';

/** A mail just stored, and what the list shows of its thread when it is the one that opened it. */
interface StoredMail {
  messageId: string;
  subject: string;
}

async function countMessages(transaction: Transaction, ofThread: SQL) {
  const [facts] = await transaction
    .select({
      messageCount: count(),
      unread: sql<boolean>`coalesce(bool_or(${message.unread}), false)`,
      inInbox: sql<boolean>`coalesce(bool_or(${message.inInbox}), false)`,
    })
    .from(message)
    .where(ofThread);
  return facts;
}

async function readLatestMessage(transaction: Transaction, ofThread: SQL) {
  const [latest] = await transaction
    .select({
      senderName: message.fromName,
      senderAddress: message.fromAddress,
      snippet: message.snippet,
      lastMessageAt: message.sentAt,
    })
    .from(message)
    .where(ofThread)
    .orderBy(desc(message.sentAt), desc(message.id))
    .limit(1);
  return latest;
}

async function findOldestMessageId(transaction: Transaction, ofThread: SQL) {
  const [oldest] = await transaction
    .select({ id: message.id })
    .from(message)
    .where(ofThread)
    .orderBy(asc(message.sentAt), asc(message.id))
    .limit(1);
  return oldest?.id;
}

/** A file the body displays is part of the body, not an attachment of the mail. */
async function hasAttachedFile(transaction: Transaction, ofThread: SQL): Promise<boolean> {
  const [file] = await transaction
    .select({ id: attachment.id })
    .from(attachment)
    .innerJoin(message, eq(attachment.messageId, message.id))
    .where(and(ofThread, isNull(attachment.contentId)))
    .limit(1);
  return file !== undefined;
}

/**
 * Works out again what a mail list shows of a thread, from the messages stored so far: lists read
 * the thread alone. The subject is the one of its oldest message, as the conversation was named.
 */
export async function summariseThread(
  transaction: Transaction,
  threadId: string,
  stored: StoredMail,
): Promise<void> {
  const ofThread = eq(message.threadId, threadId);
  const facts = await countMessages(transaction, ofThread);
  const latest = await readLatestMessage(transaction, ofThread);
  if (facts === undefined || latest === undefined) {
    throw new Error('A thread just written to has no message');
  }
  const opensThread = (await findOldestMessageId(transaction, ofThread)) === stored.messageId;
  await transaction
    .update(thread)
    .set({
      ...facts,
      ...latest,
      hasAttachments: await hasAttachedFile(transaction, ofThread),
      ...(opensThread ? { subject: stored.subject } : {}),
    })
    .where(eq(thread.id, threadId));
}
