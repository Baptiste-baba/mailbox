import { type Database, mailbox, thread } from '@mailbox/db';
import type { MailboxList, MailboxSummary } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, type SQL } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { mailboxNotFound } from './mailbox-not-found.ts';

@Injectable()
export class MailboxesService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** The connected mailboxes, in the order they were connected. */
  async list(): Promise<MailboxList> {
    return { mailboxes: await this.summaries() };
  }

  /** @throws AppError MAILBOX_NOT_FOUND */
  async get(mailboxId: string): Promise<MailboxSummary> {
    const [summary] = await this.summaries(eq(mailbox.id, mailboxId));
    if (summary === undefined) {
      throw mailboxNotFound(mailboxId);
    }
    return summary;
  }

  private async summaries(filter?: SQL): Promise<MailboxSummary[]> {
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
      .where(filter)
      .orderBy(asc(mailbox.createdAt), asc(mailbox.id));
    return mailboxes.map((stored) => ({ ...stored, status: toStatus(stored.status) }));
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
