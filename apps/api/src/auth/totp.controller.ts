import {
  type TotpConfirmation,
  type TotpEnrollment,
  totpConfirmationSchema,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service.ts';
import { SessionGuard } from './session.guard.ts';

/** A new authenticator app for the signed-in account. */
// Guarded here already: the global guard comes once the sign-in screens exist.
@UseGuards(SessionGuard)
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
  replace(@Body({ schema: totpConfirmationSchema }) confirmation: TotpConfirmation): Promise<void> {
    return this.account.replaceTotp(confirmation);
  }
}
