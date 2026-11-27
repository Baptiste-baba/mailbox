import { type Database, message } from '@mailbox/db';
import { AppError, type MessageBody } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import { DATABASE } from '../database/database.module.ts';

const messageIdSchema = z.uuid();

@Injectable()
export class MessagesService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  /** @throws AppError MESSAGE_NOT_FOUND */
  async body(messageId: string): Promise<MessageBody> {
    // An id that is not one of ours names no message; Postgres would refuse to even compare it.
    const [stored] = messageIdSchema.safeParse(messageId).success
      ? await this.database
          .select({ html: message.bodyHtml })
          .from(message)
          .where(eq(message.id, messageId))
      : [];
    if (stored === undefined) {
      throw new AppError('MESSAGE_NOT_FOUND', 'Message not found', { details: { messageId } });
    }
    return stored;
  }
}
