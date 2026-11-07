import {
  AppError,
  type Thread,
  type ThreadListQuery,
  type ThreadPage,
  type ThreadSummary,
} from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { TEST_DATASET } from '../test-dataset/test-dataset.module.ts';
import type { TestDataset, TestThread } from '../test-dataset/test-dataset.ts';
import { decodeThreadCursor, encodeThreadCursor, type ThreadCursor } from './thread-cursor.ts';
import { toThreadSummary } from './to-thread-summary.ts';

@Injectable()
export class ThreadsService {
  constructor(@Inject(TEST_DATASET) private readonly dataset: TestDataset) {}

  /** Threads of a view, most recent first, one page at a time. */
  list(query: ThreadListQuery): ThreadPage {
    const after = query.cursor === undefined ? undefined : decodeThreadCursor(query.cursor);
    const summaries = this.dataset.threads
      .filter((thread) => matchesQuery(thread, query))
      .map(toThreadSummary)
      .sort(compareMostRecentFirst)
      .filter((summary) => after === undefined || isAfter(summary, after));
    const threads = summaries.slice(0, query.limit);
    const last = threads.at(-1);
    const hasMore = summaries.length > threads.length && last !== undefined;
    return {
      threads,
      nextCursor: hasMore
        ? encodeThreadCursor({ lastMessageAt: last.lastMessageAt, id: last.id })
        : null,
    };
  }

  /** @throws AppError THREAD_NOT_FOUND */
  get(threadId: string): Thread {
    const thread = this.dataset.threads.find((candidate) => candidate.id === threadId);
    if (thread === undefined) {
      throw new AppError('THREAD_NOT_FOUND', 'Thread not found', { details: { threadId } });
    }
    return {
      id: thread.id,
      mailboxId: thread.mailboxId,
      subject: thread.subject,
      messages: thread.messages,
    };
  }
}

function matchesQuery(thread: TestThread, query: ThreadListQuery): boolean {
  return (
    (query.view === 'all' || thread.inInbox) &&
    (query.mailboxId === undefined || thread.mailboxId === query.mailboxId) &&
    (!query.unreadOnly || thread.unread)
  );
}

// ISO dates in UTC sort as text; the id breaks ties so that the order, and the cursor, are stable.
function compareMostRecentFirst(left: ThreadSummary, right: ThreadSummary): number {
  return compareText(right.lastMessageAt, left.lastMessageAt) || compareText(right.id, left.id);
}

// Code point order, the same on every machine, unlike the collation of a language.
function compareText(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  return left < right ? -1 : 1;
}

function isAfter(summary: ThreadSummary, cursor: ThreadCursor): boolean {
  return compareMostRecentFirst(summary, { ...summary, ...cursor }) > 0;
}
