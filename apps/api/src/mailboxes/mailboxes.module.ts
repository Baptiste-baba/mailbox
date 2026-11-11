import { Module } from '@nestjs/common';
import { MailboxesController } from './mailboxes.controller.ts';
import { MailboxesService } from './mailboxes.service.ts';

@Module({
  controllers: [MailboxesController],
  providers: [MailboxesService],
})
export class MailboxesModule {}
