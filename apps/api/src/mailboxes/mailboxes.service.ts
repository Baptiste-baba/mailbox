import { type Database, mailbox, message, thread } from '@mailbox/db';
import type { MailboxList, MailboxSummary } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gte, type SQL, sql } from 'drizzle-orm';
import { DATABASE } from '../database/database.module.ts';
import { mailboxNotFound } from './mailbox-not-found.ts';
import { toMailboxSync } from './mailbox-sync-state.ts';

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
        initialSyncCompletedAt: mailbox.initialSyncCompletedAt,
        initialSyncTotal: mailbox.initialSyncTotal,
        lastSyncedAt: mailbox.lastSyncedAt,
        syncFailingSince: mailbox.syncFailingSince,
        syncFailureReason: mailbox.syncFailureReason,
        copiedCount: this.copiedCount(),
      })
      .from(mailbox)
      .where(filter)
      .orderBy(asc(mailbox.createdAt), asc(mailbox.id));
    const now = new Date();
    return mailboxes.map(
      ({ id, provider, name, address, color, status, unreadCount, ...sync }) => ({
        ...{ id, provider, name, address, color, unreadCount },
        status: toStatus(status),
        sync: toMailboxSync(sync, now),
      }),
    );
  }

  /** The mails the copy under way stored so far: counted only while a copy is under way. */
  private copiedCount() {
    const storedByThisCopy = and(
      eq(message.mailboxId, mailbox.id),
      gte(message.syncedAt, mailbox.initialSyncStartedAt),
    );
    return sql<number>`case when ${mailbox.initialSyncCompletedAt} is null then ${this.database.$count(message, storedByThisCopy)} else 0 end`.mapWith(
      Number,
    );
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
