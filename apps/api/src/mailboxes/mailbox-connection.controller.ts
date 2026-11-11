import {
  type MailboxAuthorization,
  type MailboxConnectionCompletion,
  type MailboxConnectionRequest,
  type MailboxSummary,
  type MailProviderList,
  mailboxConnectionCompletionSchema,
  mailboxConnectionRequestSchema,
  mailboxIdSchema,
} from '@mailbox/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RecentIdentityConfirmation } from '../auth/recent-identity-confirmation.decorator.ts';
import { requireSessionToken } from '../auth/session-cookie.ts';
import { MailboxConnectionService } from './mailbox-connection.service.ts';

/** Connecting and removing mailboxes, from the settings. */
@Controller()
export class MailboxConnectionController {
  constructor(private readonly connection: MailboxConnectionService) {}

  @Get('mail-providers')
  providers(): MailProviderList {
    return this.connection.providers();
  }

  @RecentIdentityConfirmation()
  @Post('mailboxes/connection')
  @HttpCode(HttpStatus.OK)
  start(
    @Body({ schema: mailboxConnectionRequestSchema }) connection: MailboxConnectionRequest,
    @Req() request: Request,
  ): MailboxAuthorization {
    return this.connection.start(connection, requireSessionToken(request));
  }

  @RecentIdentityConfirmation()
  @Post('mailboxes/:mailboxId/reconnection')
  @HttpCode(HttpStatus.OK)
  startReconnection(
    @Param('mailboxId', { schema: mailboxIdSchema }) mailboxId: string,
    @Req() request: Request,
  ): Promise<MailboxAuthorization> {
    return this.connection.startReconnection(mailboxId, requireSessionToken(request));
  }

  // The state, known to this session only, vouches for the connection. Asking for a recent
  // confirmation again could refuse a user who took their time signing in at the provider.
  @Post('mailboxes/connection/completion')
  @HttpCode(HttpStatus.OK)
  complete(
    @Body({ schema: mailboxConnectionCompletionSchema }) completion: MailboxConnectionCompletion,
    @Req() request: Request,
  ): Promise<MailboxSummary> {
    return this.connection.complete(completion, requireSessionToken(request));
  }

  @RecentIdentityConfirmation()
  @Delete('mailboxes/:mailboxId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('mailboxId', { schema: mailboxIdSchema }) mailboxId: string): Promise<void> {
    return this.connection.remove(mailboxId);
  }
}
