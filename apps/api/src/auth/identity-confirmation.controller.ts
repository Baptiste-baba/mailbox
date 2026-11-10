import {
  type IdentityConfirmation,
  identityConfirmationSchema,
  type PasskeyRequestOptions,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { clientAddress } from './client-address.ts';
import { IdentityConfirmationService } from './identity-confirmation.service.ts';
import { PasskeyAssertionService } from './passkey-assertion.service.ts';
import { requireSessionToken } from './session-cookie.ts';

/** Proving again who one is on this device, before changing how one signs in. */
@Controller('auth/identity-confirmation')
export class IdentityConfirmationController {
  constructor(
    private readonly assertions: PasskeyAssertionService,
    private readonly confirmations: IdentityConfirmationService,
  ) {}

  @Post('options')
  @HttpCode(HttpStatus.OK)
  options(@Req() request: Request): Promise<PasskeyRequestOptions> {
    return this.assertions.options('identityConfirmation', requireSessionToken(request));
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  confirm(
    @Body({ schema: identityConfirmationSchema }) confirmation: IdentityConfirmation,
    @Req() request: Request,
  ): Promise<void> {
    return this.confirmations.confirm(
      confirmation,
      requireSessionToken(request),
      clientAddress(request),
    );
  }
}
