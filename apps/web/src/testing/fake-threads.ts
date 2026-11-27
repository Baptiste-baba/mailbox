import type { Thread, ThreadSummary } from '@mailbox/shared';
import { apiError, fakeApi, testThread } from './fake-api.ts';

/** The thread behind a summary, as the api gives it once opened: one message from its sender. */
function threadOf({ id, mailboxId, subject, sender }: ThreadSummary): Thread {
  return {
    id,
    mailboxId,
    subject,
    messages: [
      {
        id: `${id}-message`,
        from: sender,
        to: [{ name: 'Alex', address: 'alex@example.com' }],
        cc: [],
        sentAt: '2026-11-08T08:00:00.000Z',
        bodyText: `Corps de ${id}`,
        attachments: [],
      },
    ],
  };
}

/**
 * Fakes an api holding `count` read threads, `thread-0` first, each of which opens on a message
 * reading "Corps de thread-N". Any other thread no longer exists.
 */
export function fakeThreads(count: number) {
  const threads = Array.from({ length: count }, (_, index) => testThread(`thread-${index}`, false));
  return fakeApi({
    threadPages: () => ({ threads, nextCursor: null }),
    thread: (threadId) => {
      const summary = threads.find((thread) => thread.id === threadId);
      return summary === undefined ? apiError(404, 'THREAD_NOT_FOUND')() : threadOf(summary);
    },
  });
}
