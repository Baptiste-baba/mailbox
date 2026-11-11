import { Module } from '@nestjs/common';
import { ThreadsController } from './threads.controller.ts';
import { ThreadsService } from './threads.service.ts';

@Module({
  controllers: [ThreadsController],
  providers: [ThreadsService],
})
export class ThreadsModule {}
