import { type Database, thread } from '@mailbox/db';
import { AppError, type Thread, type ThreadListQuery, type ThreadPage } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, type SQL, sql } from 'drizzle-orm';
import * as z from 'zod';
import { DATABASE } from '../database/database.module.ts';
import { findThreadWithMessages } from './find-thread-with-messages.ts';
import { decodeThreadCursor, encodeThreadCursor, type ThreadCursor } from './thread-cursor.ts';
import { toThread, toThreadSummary } from './thread-mapping.ts';

const threadIdSchema = z.uuid();

@Injectable()
export class ThreadsService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** Threads of a view, most recent first, one page at a time. */
  async list(query: ThreadListQuery): Promise<ThreadPage> {
    const after = query.cursor === undefined ? undefined : decodeThreadCursor(query.cursor);
    // One thread more than the page tells whether another page follows.
    const stored = await this.database
      .select()
      .from(thread)
      .where(and(...viewFilters(query), after === undefined ? undefined : olderThan(after)))
      .orderBy(desc(thread.lastMessageAt), desc(thread.id))
      .limit(query.limit + 1);
    const threads = stored.slice(0, query.limit).map(toThreadSummary);
    const last = threads.at(-1);
    const hasMore = stored.length > query.limit && last !== undefined;
    return {
      threads,
      nextCursor: hasMore
        ? encodeThreadCursor({ lastMessageAt: last.lastMessageAt, id: last.id })
        : null,
    };
  }

  /** @throws AppError THREAD_NOT_FOUND */
  async get(threadId: string): Promise<Thread> {
    // An id that is not one of ours names no thread; Postgres would refuse to even compare it.
    const stored = threadIdSchema.safeParse(threadId).success
      ? await findThreadWithMessages(this.database, threadId)
      : undefined;
    if (stored === undefined) {
      throw new AppError('THREAD_NOT_FOUND', 'Thread not found', { details: { threadId } });
    }
    return toThread(stored);
  }
}

// The columns are compared bare, not to a parameter: Postgres then knows which index holds the view.
function viewFilters(query: ThreadListQuery): (SQL | undefined)[] {
  return [
    query.view === 'inbox' ? sql`${thread.inInbox}` : undefined,
    query.mailboxId === undefined ? undefined : eq(thread.mailboxId, query.mailboxId),
    query.unreadOnly ? sql`${thread.unread}` : undefined,
  ];
}

// The position after a page, in the order of the list: dates then ids, compared as one pair.
function olderThan(cursor: ThreadCursor): SQL {
  return sql`(${thread.lastMessageAt}, ${thread.id}) < (${cursor.lastMessageAt}::timestamptz, ${cursor.id}::uuid)`;
}
