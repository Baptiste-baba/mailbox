import { AppError } from '@mailbox/shared';
import * as z from 'zod';

/** Where a page ends: the sort key of its last thread. */
const threadCursorSchema = z.object({
  lastMessageAt: z.iso.datetime(),
  id: z.uuid(),
});

export type ThreadCursor = z.infer<typeof threadCursorSchema>;

// Opaque to clients: they pass it back as they got it.
export function encodeThreadCursor(cursor: ThreadCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/** @throws AppError VALIDATION_FAILED when the cursor was not produced by this api. */
export function decodeThreadCursor(encoded: string): ThreadCursor {
  try {
    return threadCursorSchema.parse(JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')));
  } catch (error) {
    throw new AppError('VALIDATION_FAILED', 'Invalid cursor', { cause: error });
  }
}
