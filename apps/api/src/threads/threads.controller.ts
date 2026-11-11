import {
  type Thread,
  type ThreadListQuery,
  type ThreadPage,
  threadListQuerySchema,
} from '@mailbox/shared';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ThreadsService } from './threads.service.ts';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threads: ThreadsService) {}

  @Get()
  list(@Query({ schema: threadListQuerySchema }) query: ThreadListQuery): Promise<ThreadPage> {
    return this.threads.list(query);
  }

  @Get(':threadId')
  get(@Param('threadId') threadId: string): Promise<Thread> {
    return this.threads.get(threadId);
  }
}
