import { AppError } from '@mailbox/shared';
import { describe, expect, test } from 'vitest';
import { decodeThreadCursor, encodeThreadCursor } from './thread-cursor.ts';

describe('thread cursor', () => {
  test('gives back the position it encodes', () => {
    const cursor = { lastMessageAt: '2026-11-08T09:13:00.000Z', id: 'thread-7' };

    expect(decodeThreadCursor(encodeThreadCursor(cursor))).toEqual(cursor);
  });

  test('rejects a cursor this api did not produce', () => {
    for (const forged of ['not-a-cursor', Buffer.from('{"id":"thread-7"}').toString('base64url')]) {
      expect(() => decodeThreadCursor(forged)).toThrow(AppError);
    }
  });
});
