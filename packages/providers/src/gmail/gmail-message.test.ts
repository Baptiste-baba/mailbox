import { describe, expect, it } from 'vitest';
import { readGmailFixture } from './fixtures/read-gmail-fixture.ts';
import { toProviderMessage } from './to-provider-message.ts';

const read = (name: string) => toProviderMessage(readGmailFixture(name));

describe('reading a Gmail message', () => {
  it('reads a mail of plain text, sent from the mailbox', () => {
    expect(read('plain-text')).toEqual({
      providerMessageId: '19a0000000001111',
      providerThreadId: '19a0000000001111',
      subject: 'eocjgxbbavs',
      from: { name: 'Rrpomobm Almldyq', address: 'alex.martin@example.com' },
      to: [{ name: '', address: 'contact-1@example.com' }],
      cc: [],
      sentAt: new Date('2026-11-26T10:57:55.000Z'),
      snippet: 'Xreu uitnvkn mcj osbcauppxwcel axbfqmykz jv Xfuuq.',
      bodyText: 'Yfue bfkpiby vbb muxropkublsof ppkcphaoz oc Gqakp.\r\n',
      bodyHtml: null,
      unread: false,
      inInbox: false,
      providerFolderIds: [],
      attachments: [],
    });
  });

  it('reads a mail that only has an HTML body', () => {
    const message = read('html-only');

    expect(message.bodyText).toBeNull();
    expect(message.bodyHtml).toMatch(/^<[a-z!]/i);
    expect(message.bodyHtml).toContain('</div>');
  });
});

describe('reading the people and the state of a Gmail message', () => {
  it('reads who a mail is from, to and in copy of', () => {
    const message = read('with-cc');

    expect(message.from).toEqual({
      name: 'Aqcumf UDHZTUTYNS wfq wwx-gtxmcnkvqotht',
      address: 'ljlyolujhc.b=contact-14@example.com',
    });
    expect(message.to).toEqual([{ name: '', address: 'contact-3@example.com' }]);
    expect(message.cc).toEqual([{ name: 'ophrqap.ooojcavh', address: 'contact-15@example.com' }]);
    expect(message.subject).toBe(
      'Re: [DA] Eukxkkgov feoyw qlfabdkf (aôpvkfofyzpnu cnrgqwzpee E1B)',
    );
  });

  it('tells what is unread, in the inbox, and filed in a folder of the user', () => {
    expect(read('newsletter')).toMatchObject({
      unread: true,
      inInbox: true,
      providerFolderIds: [],
    });
    expect(read('with-cc')).toMatchObject({
      unread: false,
      inInbox: false,
      providerFolderIds: ['Label_1'],
    });
  });

  it('gives the snippet as plain text, which Gmail escapes for a page', () => {
    expect(read('pdf-attachment').snippet).toContain("c'srnasgyt");
    expect(read('pdf-attachment').snippet).not.toContain('&#39;');
  });
});

describe('reading the bodies of a Gmail message', () => {
  // Gmail gives UTF-8 whatever the part declares: reading it as Windows-1252 would garble it.
  it('reads accents of a part that declares another charset than the one Gmail answers in', () => {
    const message = read('declared-windows-1252');

    expect(message.bodyText).toMatch(/^Ackmd è jwed,\r\n/);
    expect(message.bodyHtml).not.toMatch(/Ã|�/);
    expect(message.bodyText).not.toMatch(/Ã|�/);
  });

  it('reads both bodies of a heavy newsletter, styles and all', () => {
    const message = read('newsletter');

    expect(message.bodyText).toContain('](https://example.com/page)');
    expect(message.bodyHtml).toContain('<style');
    expect(message.bodyHtml).toMatch(/<\/html>\s*$/);
    expect(message.attachments).toEqual([]);
  });
});

describe('reading the files of a Gmail message', () => {
  it('lists a file attached to the mail', () => {
    expect(read('pdf-attachment').attachments).toEqual([
      {
        fileName: 'Qsnrlm_byhwnm_metgo_asmufaoj_5047.pdf',
        mimeType: 'application/pdf',
        size: 84136,
        contentId: null,
      },
    ]);
  });

  it('lists an invitation as a file, and leaves it out of the bodies', () => {
    const message = read('calendar-invite');

    expect(message.attachments).toEqual([
      {
        fileName: '66-67-0905-s-26n83.ics',
        mimeType: 'text/calendar',
        size: 1999,
        contentId: null,
      },
    ]);
    expect(message.bodyText).toMatch(/^Lbftltix \( https:\/\/example\.com\/page \)/);
    expect(message.bodyText).not.toContain('VCALENDAR');
  });

  it('tells an image the body displays from the files attached', () => {
    expect(read('thread-message-6').attachments).toEqual([
      {
        fileName: 'acvkq739.jpg',
        mimeType: 'image/jpeg',
        size: 332,
        contentId: 'part-4@example.com',
      },
    ]);
  });

  // Senders give an id to files the body never displays: those stay attachments.
  it('keeps as attachments the images that carry an id the body does not use', () => {
    expect(read('inline-image').attachments).toEqual([
      { fileName: 'jjwpy663.gif', mimeType: 'image/gif', size: 3725, contentId: null },
      { fileName: 'ujjsg718.jpg', mimeType: 'image/jpeg', size: 60848, contentId: null },
    ]);
  });
});

describe('reading a conversation of Gmail', () => {
  const messages = [1, 2, 3, 4, 5, 6].map((rank) => read(`thread-message-${rank}`));

  it('files every message in the same conversation, each under its own id', () => {
    expect(new Set(messages.map((message) => message.providerThreadId)).size).toBe(1);
    expect(new Set(messages.map((message) => message.providerMessageId)).size).toBe(6);
  });

  it('dates the messages in the order Gmail received them', () => {
    const dates = messages.map((message) => message.sentAt.getTime());

    expect(dates).toEqual([...dates].sort((first, second) => first - second));
  });
});
