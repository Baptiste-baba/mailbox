import {
  type PasskeyCreationOptions,
  type PasskeyList,
  type PasskeyRegistration,
  passkeyIdSchema,
  passkeyRegistrationSchema,
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
import { PasskeysService } from './passkeys.service.ts';
import { RecentIdentityConfirmation } from './recent-identity-confirmation.decorator.ts';
import { requireSessionToken } from './session-cookie.ts';

/** The passkeys of the account, from the security settings. */
@Controller('auth/passkeys')
export class PasskeysController {
  constructor(private readonly passkeys: PasskeysService) {}

  @Get()
  list(): Promise<PasskeyList> {
    return this.passkeys.list();
  }

  @RecentIdentityConfirmation()
  @Post('options')
  @HttpCode(HttpStatus.OK)
  creationOptions(@Req() request: Request): Promise<PasskeyCreationOptions> {
    return this.passkeys.creationOptions(requireSessionToken(request));
  }

  // The challenge of the options, bound to this session, vouches for the addition. Asking for a
  // recent confirmation again could refuse a passkey the password manager has already created.
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @Body({ schema: passkeyRegistrationSchema }) registration: PasskeyRegistration,
    @Req() request: Request,
  ): Promise<void> {
    return this.passkeys.add(registration, requireSessionToken(request));
  }

  @RecentIdentityConfirmation()
  @Delete(':passkeyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('passkeyId', { schema: passkeyIdSchema }) passkeyId: string): Promise<void> {
    return this.passkeys.remove(passkeyId);
  }
}
