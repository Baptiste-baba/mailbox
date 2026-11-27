import { attachment, type Database, message, thread } from '@mailbox/db';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { removeMessage } from '../../src/sync/remove-message.ts';
import { storeMessage } from '../../src/sync/store-message.ts';
import { insertTestMailbox, openTestDatabase, resetMailTables, testMail } from './test-mail.ts';

const pdf = { fileName: 'devis.pdf', mimeType: 'application/pdf', size: 84_136, contentId: null };
const inThread = { providerThreadId: 'thread-1' };
const first = testMail('m1', {
  ...inThread,
  subject: 'Devis',
  sentAt: new Date('2026-11-20T09:00:00.000Z'),
  snippet: 'Voici le devis.',
});
const reply = testMail('m2', {
  ...inThread,
  subject: 'Re: Devis',
  from: { name: 'Zoé Lefèvre', address: 'zoe@example.com' },
  sentAt: new Date('2026-11-21T10:00:00.000Z'),
  snippet: 'Parfait, merci.',
  unread: true,
  attachments: [pdf],
});

let database: Database;
let mailboxId: string;

beforeEach(async () => {
  database ??= openTestDatabase();
  await resetMailTables(database);
  mailboxId = await insertTestMailbox(database);
  await storeMessage(database, mailboxId, first);
  await storeMessage(database, mailboxId, reply);
});

afterAll(async () => {
  await database.$client.end();
});

describe('removing a mail the provider no longer has', () => {
  it('removes the mail and its files, and shows of the thread what its other mails say', async () => {
    await removeMessage(database, mailboxId, 'm2');

    const messages = await database.select({ id: message.providerMessageId }).from(message);
    expect(messages).toEqual([{ id: 'm1' }]);
    expect(await database.select().from(attachment)).toEqual([]);
    const [summary] = await database.select().from(thread);
    expect(summary).toMatchObject({
      subject: 'Devis',
      senderName: 'Camille Roux',
      snippet: 'Voici le devis.',
      lastMessageAt: first.sentAt,
      messageCount: 1,
      unread: false,
      hasAttachments: false,
    });
  });

  it('removes the thread with its last mail', async () => {
    await removeMessage(database, mailboxId, 'm1');
    await removeMessage(database, mailboxId, 'm2');

    expect(await database.select().from(thread)).toEqual([]);
  });

  it('changes nothing for a mail that was never stored', async () => {
    await removeMessage(database, mailboxId, 'never-stored');

    expect(await database.select().from(message)).toHaveLength(2);
    expect((await database.select().from(thread))[0]?.messageCount).toBe(2);
  });
});
