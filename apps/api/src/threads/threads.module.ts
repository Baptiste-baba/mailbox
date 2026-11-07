import { Module } from '@nestjs/common';
import { TestDatasetModule } from '../test-dataset/test-dataset.module.ts';
import { ThreadsController } from './threads.controller.ts';
import { ThreadsService } from './threads.service.ts';

@Module({
  imports: [TestDatasetModule],
  controllers: [ThreadsController],
  providers: [ThreadsService],
})
export class ThreadsModule {}
