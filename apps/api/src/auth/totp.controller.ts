import {
  AppError,
  type TotpConfirmation,
  type TotpEnrollment,
  totpConfirmationSchema,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AccountService } from './account.service.ts';
import { AuthenticatorReplacementRoute } from './authenticator-replacement.decorator.ts';
import { readSessionToken } from './session-cookie.ts';

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
    const sessionToken = readSessionToken(request);
    // The session guard lets no request through without a session: this only narrows the type.
    if (sessionToken === undefined) {
      throw new AppError('UNAUTHENTICATED', 'Sign in first');
    }
    await this.account.replaceTotp(confirmation, sessionToken);
  }
}
