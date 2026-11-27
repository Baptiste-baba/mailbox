import {
  attachment,
  type Database,
  folder,
  message,
  messageFolder,
  type Transaction,
  thread,
} from '@mailbox/db';
import type { ProviderAttachment, ProviderMessage } from '@mailbox/shared';
import { and, eq, inArray } from 'drizzle-orm';
import { storableMessage } from './storable-message.ts';
import { summariseThread } from './summarise-thread.ts';

/**
 * The thread of a mail, created when the mail is the first stored of its conversation. The row
 * stays locked until the mail is stored: two mails of a thread never summarise it at once.
 */
async function openThread(
  transaction: Transaction,
  mailboxId: string,
  mail: ProviderMessage,
): Promise<string> {
  const [stored] = await transaction
    .insert(thread)
    .values({
      mailboxId,
      providerThreadId: mail.providerThreadId,
      subject: mail.subject,
      senderName: mail.from.name,
      senderAddress: mail.from.address,
      snippet: mail.snippet,
      lastMessageAt: mail.sentAt,
      messageCount: 0,
      unread: mail.unread,
      inInbox: mail.inInbox,
      hasAttachments: false,
    })
    .onConflictDoUpdate({
      target: [thread.mailboxId, thread.providerThreadId],
      set: { providerThreadId: mail.providerThreadId },
    })
    .returning({ id: thread.id });
  if (stored === undefined) {
    throw new Error('Opening the thread returned no row');
  }
  return stored.id;
}

async function writeMessage(
  transaction: Transaction,
  place: { mailboxId: string; threadId: string },
  mail: ProviderMessage,
): Promise<string> {
  const content = {
    threadId: place.threadId,
    fromName: mail.from.name,
    fromAddress: mail.from.address,
    toRecipients: mail.to,
    ccRecipients: mail.cc,
    sentAt: mail.sentAt,
    snippet: mail.snippet,
    bodyText: mail.bodyText,
    bodyHtml: mail.bodyHtml,
    unread: mail.unread,
    inInbox: mail.inInbox,
    syncedAt: new Date(),
  };
  const [stored] = await transaction
    .insert(message)
    .values({ mailboxId: place.mailboxId, providerMessageId: mail.providerMessageId, ...content })
    .onConflictDoUpdate({ target: [message.mailboxId, message.providerMessageId], set: content })
    .returning({ id: message.id });
  if (stored === undefined) {
    throw new Error('Storing the message returned no row');
  }
  return stored.id;
}

async function writeAttachments(
  transaction: Transaction,
  messageId: string,
  files: ProviderAttachment[],
): Promise<void> {
  await transaction.delete(attachment).where(eq(attachment.messageId, messageId));
  if (files.length > 0) {
    await transaction
      .insert(attachment)
      .values(files.map((file, position) => ({ messageId, position, ...file })));
  }
}

/** Files the message in the folders it has at the provider, among those known of the mailbox. */
async function fileInFolders(
  transaction: Transaction,
  place: { mailboxId: string; messageId: string },
  providerFolderIds: string[],
): Promise<void> {
  await transaction.delete(messageFolder).where(eq(messageFolder.messageId, place.messageId));
  if (providerFolderIds.length === 0) {
    return;
  }
  const folders = await transaction
    .select({ folderId: folder.id })
    .from(folder)
    .where(
      and(
        eq(folder.mailboxId, place.mailboxId),
        inArray(folder.providerFolderId, providerFolderIds),
      ),
    );
  if (folders.length > 0) {
    await transaction
      .insert(messageFolder)
      .values(folders.map(({ folderId }) => ({ messageId: place.messageId, folderId })));
  }
}

/**
 * Stores a mail read at a provider, with its files and folders, and brings its thread up to date.
 * Storing a mail again replaces what was stored of it: the provider is the source of truth.
 */
export async function storeMessage(
  database: Database,
  mailboxId: string,
  readMail: ProviderMessage,
): Promise<void> {
  const mail = storableMessage(readMail);
  await database.transaction(async (transaction) => {
    const threadId = await openThread(transaction, mailboxId, mail);
    const messageId = await writeMessage(transaction, { mailboxId, threadId }, mail);
    await writeAttachments(transaction, messageId, mail.attachments);
    await fileInFolders(transaction, { mailboxId, messageId }, mail.providerFolderIds);
    await summariseThread(transaction, threadId, { messageId, subject: mail.subject });
  });
}
