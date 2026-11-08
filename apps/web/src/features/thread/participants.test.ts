import type { Message } from '@mailbox/shared';
import { describe, expect, test } from 'vitest';
import { participantsLine, personName, recipientsLine, replyRecipients } from './participants.ts';

const own = 'alex@example.com';
const alex = { name: 'Alex Moreau', address: 'Alex@Example.com' };
const nadia = { name: 'Nadia Benali', address: 'nadia@example.com' };
const thomas = { name: 'Thomas Leroy', address: 'thomas@example.com' };
const noName = { name: '', address: 'no-reply@example.com' };

function message(from: Message['from'], to: Message['to'], cc: Message['cc'] = []): Message {
  return {
    id: 'm',
    from,
    to,
    cc,
    sentAt: '2026-11-08T08:00:00.000Z',
    bodyText: '',
    attachments: [],
  };
}

describe('participants', () => {
  test('names the owner "toi", whatever the case of the address, and others by name or address', () => {
    expect(personName(alex, own)).toBe('toi');
    expect(personName(nadia, own)).toBe('Nadia Benali');
    expect(personName(noName, own)).toBe('no-reply@example.com');
  });

  test('lists everyone once, the owner last', () => {
    const messages = [message(nadia, [alex]), message(alex, [nadia], [thomas])];

    expect(participantsLine(messages, own)).toBe('Nadia Benali, Thomas Leroy et toi');
  });

  test('says who a message went to', () => {
    expect(recipientsLine(message(nadia, [alex], [thomas]), own)).toBe('à toi, cc Thomas Leroy');
    expect(recipientsLine(message(alex, [nadia, thomas]), own)).toBe(
      'à Nadia Benali et Thomas Leroy',
    );
  });

  test('replies to everyone on the latest message but the owner', () => {
    expect(replyRecipients(message(nadia, [alex], [thomas]), own)).toBe(
      'Nadia Benali et Thomas Leroy',
    );
    expect(replyRecipients(message(alex, [nadia]), own)).toBe('Nadia Benali');
  });
});
