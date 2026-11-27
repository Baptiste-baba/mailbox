import { attachment, type Database, folder, message, messageFolder, thread } from '@mailbox/db';
import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { storeFolders } from '../../src/sync/store-folders.ts';
import { storeMessage } from '../../src/sync/store-message.ts';
import { insertTestMailbox, openTestDatabase, resetMailTables, testMail } from './test-mail.ts';

const pdf = { fileName: 'devis.pdf', mimeType: 'application/pdf', size: 84_136, contentId: null };
const logo = { fileName: 'logo.png', mimeType: 'image/png', size: 332, contentId: 'logo@example' };

let database: Database;
let mailboxId: string;

beforeEach(async () => {
  database ??= openTestDatabase();
  await resetMailTables(database);
  mailboxId = await insertTestMailbox(database);
});

afterAll(async () => {
  await database.$client.end();
});

async function onlyThread() {
  const threads = await database.select().from(thread);
  expect(threads).toHaveLength(1);
  return threads[0];
}

describe('storing a mail', () => {
  it('stores the mail and opens its thread', async () => {
    const mail = testMail('m1', {
      cc: [{ name: 'Sam', address: 'sam@example.com' }],
      unread: true,
    });

    await storeMessage(database, mailboxId, mail);

    const [stored] = await database.select().from(message);
    expect(stored).toMatchObject({
      mailboxId,
      providerMessageId: 'm1',
      fromName: 'Camille Roux',
      fromAddress: 'camille.roux@example.com',
      toRecipients: [{ name: '', address: 'alex.martin@example.com' }],
      ccRecipients: [{ name: 'Sam', address: 'sam@example.com' }],
      sentAt: mail.sentAt,
      snippet: 'Début de m1',
      bodyText: 'Texte de m1',
      bodyHtml: null,
      unread: true,
      inInbox: true,
    });
    expect(await onlyThread()).toMatchObject({
      id: stored?.threadId,
      providerThreadId: 'thread-of-m1',
      subject: 'Sujet m1',
      messageCount: 1,
    });
  });
});

describe('storing a mail again, or one Postgres would refuse', () => {
  it('replaces what was stored of a mail read again, without a second copy', async () => {
    await storeMessage(database, mailboxId, testMail('m1', { unread: true, attachments: [pdf] }));

    await storeMessage(database, mailboxId, testMail('m1', { unread: false, attachments: [] }));

    const messages = await database.select().from(message);
    expect(messages).toHaveLength(1);
    expect(messages[0]?.unread).toBe(false);
    expect(await database.select().from(attachment)).toEqual([]);
    expect(await onlyThread()).toMatchObject({
      unread: false,
      hasAttachments: false,
      messageCount: 1,
    });
  });

  // Postgres refuses the null character, which some mails carry: the mail must not be lost for it.
  it('stores a mail whose texts carry a null character, without it', async () => {
    const mail = testMail('m1', {
      subject: 'Su\u0000jet',
      bodyText: 'Tex\u0000te',
      bodyHtml: '<p>\u0000</p>',
    });

    await storeMessage(database, mailboxId, mail);

    const [stored] = await database.select().from(message);
    expect(stored).toMatchObject({ bodyText: 'Texte', bodyHtml: '<p></p>' });
    expect((await onlyThread())?.subject).toBe('Sujet');
  });
});

describe('storing the files and folders of a mail', () => {
  it('stores its files in the order the mail carries them', async () => {
    await storeMessage(database, mailboxId, testMail('m1', { attachments: [logo, pdf] }));

    const files = await database.select().from(attachment).orderBy(attachment.position);
    expect(files).toMatchObject([
      { position: 0, ...logo },
      { position: 1, ...pdf },
    ]);
  });

  it('says a thread has attachments for a file attached, not for one its body displays', async () => {
    await storeMessage(database, mailboxId, testMail('m1', { attachments: [logo] }));
    expect((await onlyThread())?.hasAttachments).toBe(false);

    await storeMessage(database, mailboxId, testMail('m1', { attachments: [logo, pdf] }));

    expect((await onlyThread())?.hasAttachments).toBe(true);
  });

  it('files the mail in the folders it has at the provider, among those of the mailbox', async () => {
    await storeFolders(database, mailboxId, [
      { providerFolderId: 'Label_1', name: 'Factures' },
      { providerFolderId: 'Label_2', name: 'Voyages' },
    ]);

    await storeMessage(
      database,
      mailboxId,
      testMail('m1', { providerFolderIds: ['Label_2', 'Label_9'] }),
    );

    const filed = await database
      .select({ name: folder.name })
      .from(messageFolder)
      .innerJoin(folder, eq(messageFolder.folderId, folder.id));
    expect(filed).toEqual([{ name: 'Voyages' }]);
  });
});

describe('storing the mails of a conversation, most recent first', () => {
  const inThread = { providerThreadId: 'thread-1' };
  const reply = testMail('m2', {
    ...inThread,
    subject: 'Re: Devis',
    from: { name: 'Zoé Lefèvre', address: 'zoe@example.com' },
    sentAt: new Date('2026-11-21T10:00:00.000Z'),
    snippet: 'Parfait, merci.',
    inInbox: false,
  });
  const first = testMail('m1', {
    ...inThread,
    subject: 'Devis',
    sentAt: new Date('2026-11-20T09:00:00.000Z'),
    unread: true,
    attachments: [pdf],
  });

  it('shows of the thread its latest mail, under the subject of its first one', async () => {
    await storeMessage(database, mailboxId, reply);
    expect(await onlyThread()).toMatchObject({ subject: 'Re: Devis', messageCount: 1 });

    await storeMessage(database, mailboxId, first);

    expect(await onlyThread()).toMatchObject({
      subject: 'Devis',
      senderName: 'Zoé Lefèvre',
      senderAddress: 'zoe@example.com',
      snippet: 'Parfait, merci.',
      lastMessageAt: reply.sentAt,
      messageCount: 2,
    });
  });

  it('marks the thread unread, in the inbox or with attachments when one of its mails is', async () => {
    await storeMessage(database, mailboxId, reply);
    expect(await onlyThread()).toMatchObject({
      unread: false,
      inInbox: false,
      hasAttachments: false,
    });

    await storeMessage(database, mailboxId, first);

    expect(await onlyThread()).toMatchObject({ unread: true, inInbox: true, hasAttachments: true });
  });
});

describe('storing the folders of a mailbox', () => {
  it('adds the new ones, renames the renamed ones and removes those gone at the provider', async () => {
    await storeFolders(database, mailboxId, [
      { providerFolderId: 'Label_1', name: 'Factures' },
      { providerFolderId: 'Label_2', name: 'Voyages' },
    ]);

    await storeFolders(database, mailboxId, [
      { providerFolderId: 'Label_2', name: 'Vacances' },
      { providerFolderId: 'Label_3', name: 'Banque' },
    ]);

    const folders = await database
      .select({ providerFolderId: folder.providerFolderId, name: folder.name })
      .from(folder)
      .orderBy(folder.providerFolderId);
    expect(folders).toEqual([
      { providerFolderId: 'Label_2', name: 'Vacances' },
      { providerFolderId: 'Label_3', name: 'Banque' },
    ]);
  });

  it('removes every folder of a mailbox that has none left', async () => {
    await storeFolders(database, mailboxId, [{ providerFolderId: 'Label_1', name: 'Factures' }]);

    await storeFolders(database, mailboxId, []);

    expect(await database.select().from(folder)).toEqual([]);
  });
});
