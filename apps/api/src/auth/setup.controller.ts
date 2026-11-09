import {
  type SetupEnrollmentRequest,
  type SetupRequest,
  type SetupResponse,
  setupEnrollmentRequestSchema,
  setupRequestSchema,
  type TotpEnrollment,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { clientAddress } from './client-address.ts';
import { Public } from './public.decorator.ts';
import { SessionService } from './session.service.ts';
import { writeSessionCookie } from './session-cookie.ts';
import { SetupService } from './setup.service.ts';

@Controller('auth/setup')
export class SetupController {
  constructor(
    private readonly setup: SetupService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Post('totp-secret')
  @HttpCode(HttpStatus.OK)
  startTotpEnrollment(
    @Body({ schema: setupEnrollmentRequestSchema }) body: SetupEnrollmentRequest,
    @Req() request: Request,
  ): Promise<TotpEnrollment> {
    return this.setup.startTotpEnrollment(body, clientAddress(request));
  }

  /** Creates the account and signs in on this device: the code just typed cannot serve again. */
  @Public()
  @Post()
  async createAccount(
    @Body({ schema: setupRequestSchema }) body: SetupRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SetupResponse> {
    const created = await this.setup.createAccount(body, clientAddress(request));
    const session = await this.sessions.start(request.get('user-agent') ?? '', false);
    writeSessionCookie(response, session);
    return created;
  }
}
