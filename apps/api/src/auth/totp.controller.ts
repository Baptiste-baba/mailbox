import {
  type TotpConfirmation,
  type TotpEnrollment,
  totpConfirmationSchema,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AccountService } from './account.service.ts';
import { AuthenticatorReplacementRoute } from './authenticator-replacement.decorator.ts';
import { requireSessionToken } from './session-cookie.ts';

/** A new authenticator app, set up by a session opened with a recovery code. */
@AuthenticatorReplacementRoute()
@Controller('auth/totp')
export class TotpController {
  constructor(private readonly account: AccountService) {}

  @Post('secret')
  @HttpCode(HttpStatus.OK)
  startEnrollment(): Promise<TotpEnrollment> {
    return this.account.startTotpEnrollment();
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async replace(
    @Body({ schema: totpConfirmationSchema }) confirmation: TotpConfirmation,
    @Req() request: Request,
  ): Promise<void> {
    await this.account.replaceTotp(confirmation, requireSessionToken(request));
  }
}
