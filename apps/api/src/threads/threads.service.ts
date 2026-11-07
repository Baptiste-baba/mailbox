import type { Thread, ThreadListQuery, ThreadPage } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThreadsService {
  /** Threads of a view, most recent first, one page at a time. */
  list(_query: ThreadListQuery): ThreadPage {
    throw new Error('Not implemented yet');
  }

  /** @throws AppError THREAD_NOT_FOUND */
  get(_threadId: string): Thread {
    throw new Error('Not implemented yet');
  }
}
