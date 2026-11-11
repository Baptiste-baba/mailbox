import { type Database, mailbox, thread } from '@mailbox/db';
import type { MailboxList, MailboxSummary } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';

@Injectable()
export class MailboxesService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** The connected mailboxes, in the order they were connected. */
  async list(): Promise<MailboxList> {
    const unreadInboxThreads = and(eq(thread.mailboxId, mailbox.id), thread.inInbox, thread.unread);
    const mailboxes = await this.database
      .select({
        id: mailbox.id,
        provider: mailbox.provider,
        name: mailbox.name,
        address: mailbox.address,
        color: mailbox.color,
        status: mailbox.status,
        unreadCount: this.database.$count(thread, unreadInboxThreads),
      })
      .from(mailbox)
      .orderBy(asc(mailbox.createdAt), asc(mailbox.id));
    return {
      mailboxes: mailboxes.map((stored) => ({
        ...stored,
        status: toStatus(stored.status),
      })),
    };
  }
}

function toStatus(stored: (typeof mailbox.status.enumValues)[number]): MailboxSummary['status'] {
  switch (stored) {
    case 'connected':
      return 'connected';
    case 'reconnect_required':
      return 'reconnectRequired';
  }
}
