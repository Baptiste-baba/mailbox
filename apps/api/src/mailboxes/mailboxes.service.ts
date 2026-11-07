import type { MailboxList } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailboxesService {
  list(): MailboxList {
    throw new Error('Not implemented yet');
  }
}
