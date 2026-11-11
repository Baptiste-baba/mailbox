import { Module } from '@nestjs/common';
import { MailboxConnectionController } from './mailbox-connection.controller.ts';
import { MailboxConnectionService } from './mailbox-connection.service.ts';
import { MailboxesController } from './mailboxes.controller.ts';
import { MailboxesService } from './mailboxes.service.ts';

@Module({
  controllers: [MailboxConnectionController, MailboxesController],
  providers: [MailboxConnectionService, MailboxesService],
})
export class MailboxesModule {}
