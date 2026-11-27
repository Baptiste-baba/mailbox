import type { MessageBody } from '@mailbox/shared';
import { Controller, Get, Param } from '@nestjs/common';
import { MessagesService } from './messages.service.ts';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get(':messageId/body')
  body(@Param('messageId') messageId: string): Promise<MessageBody> {
    return this.messages.body(messageId);
  }
}
