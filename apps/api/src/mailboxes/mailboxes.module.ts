import { Module } from '@nestjs/common';
import { TestDatasetModule } from '../test-dataset/test-dataset.module.ts';
import { MailboxesController } from './mailboxes.controller.ts';
import { MailboxesService } from './mailboxes.service.ts';

@Module({
  imports: [TestDatasetModule],
  controllers: [MailboxesController],
  providers: [MailboxesService],
})
export class MailboxesModule {}
