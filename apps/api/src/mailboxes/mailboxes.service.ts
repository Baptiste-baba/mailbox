import type { MailboxList } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { TEST_DATASET } from '../test-dataset/test-dataset.module.ts';
import type { TestDataset } from '../test-dataset/test-dataset.ts';

@Injectable()
export class MailboxesService {
  constructor(@Inject(TEST_DATASET) private readonly dataset: TestDataset) {}

  list(): MailboxList {
    return {
      mailboxes: this.dataset.mailboxes.map((mailbox) => ({
        ...mailbox,
        unreadCount: this.dataset.threads.filter(
          (thread) => thread.mailboxId === mailbox.id && thread.inInbox && thread.unread,
        ).length,
      })),
    };
  }
}
