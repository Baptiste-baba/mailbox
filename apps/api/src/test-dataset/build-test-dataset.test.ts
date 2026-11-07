import { mailboxListSchema, threadSchema } from '@mailbox/shared';
import { describe, expect, test } from 'vitest';
import { buildTestDataset } from './build-test-dataset.ts';

const now = new Date('2026-11-08T10:00:00.000Z');
const dataset = buildTestDataset(now);

describe('buildTestDataset', () => {
  test('gives the same dataset for the same moment', () => {
    expect(buildTestDataset(now)).toEqual(dataset);
  });

  test('follows the mail contract', () => {
    const mailboxes = dataset.mailboxes.map((mailbox) => ({ ...mailbox, unreadCount: 0 }));
    expect(() => mailboxListSchema.parse({ mailboxes })).not.toThrow();
    for (const thread of dataset.threads) {
      expect(() => threadSchema.parse(thread)).not.toThrow();
    }
  });

  test('dates every message in the past, oldest first in each thread', () => {
    for (const thread of dataset.threads) {
      const sentAt = thread.messages.map((message) => Date.parse(message.sentAt));
      expect(sentAt.every((time) => time < now.getTime())).toBe(true);
      expect([...sentAt].sort((left, right) => left - right)).toEqual(sentAt);
    }
  });

  test('puts every thread in an existing mailbox, under a unique id', () => {
    const mailboxIds = new Set(dataset.mailboxes.map((mailbox) => mailbox.id));
    expect(dataset.threads.every((thread) => mailboxIds.has(thread.mailboxId))).toBe(true);
    expect(new Set(dataset.threads.map((thread) => thread.id)).size).toBe(dataset.threads.length);
  });

  test('covers the cases the screens must handle', () => {
    const { threads } = dataset;
    expect(threads.some((thread) => thread.unread)).toBe(true);
    expect(threads.some((thread) => !thread.inInbox)).toBe(true);
    expect(threads.some((thread) => thread.messages.length >= 10)).toBe(true);
    expect(threads.some((thread) => thread.messages.some((m) => m.attachments.length > 1))).toBe(
      true,
    );
    expect(threads.some((thread) => thread.messages.some((m) => m.from.name === ''))).toBe(true);
    expect(dataset.mailboxes.some((mailbox) => mailbox.status === 'reconnectRequired')).toBe(true);
  });
});
