import type { MailboxList } from '@mailbox/shared';
import { Controller, Get } from '@nestjs/common';
import { MailboxesService } from './mailboxes.service.ts';

@Controller('mailboxes')
export class MailboxesController {
  constructor(private readonly mailboxes: MailboxesService) {}

  @Get()
  list(): Promise<MailboxList> {
    return this.mailboxes.list();
  }
}
