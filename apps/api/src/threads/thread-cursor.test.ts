import { AppError } from '@mailbox/shared';
import { describe, expect, test } from 'vitest';
import { decodeThreadCursor, encodeThreadCursor } from './thread-cursor.ts';

describe('thread cursor', () => {
  test('gives back the position it encodes', () => {
    const cursor = {
      lastMessageAt: '2026-11-08T09:13:00.000Z',
      id: '0b8f1a52-6c1d-4f0e-9d59-3a3f2a8f4c11',
    };

    expect(decodeThreadCursor(encodeThreadCursor(cursor))).toEqual(cursor);
  });

  test('rejects a cursor this api did not produce', () => {
    const withoutDate = { id: '0b8f1a52-6c1d-4f0e-9d59-3a3f2a8f4c11' };
    const withForeignId = { lastMessageAt: '2026-11-08T09:13:00.000Z', id: 'thread-7' };
    const forgedCursors = [
      'not-a-cursor',
      ...[withoutDate, withForeignId].map((forged) =>
        Buffer.from(JSON.stringify(forged)).toString('base64url'),
      ),
    ];
    for (const forged of forgedCursors) {
      expect(() => decodeThreadCursor(forged)).toThrow(AppError);
    }
  });
});
