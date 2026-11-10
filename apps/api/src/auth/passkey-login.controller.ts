import {
  type PasskeyLoginRequest,
  type PasskeyRequestOptions,
  passkeyLoginRequestSchema,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PasskeyAssertionService } from './passkey-assertion.service.ts';
import { Public } from './public.decorator.ts';
import { SessionService } from './session.service.ts';
import { writeSessionCookie } from './session-cookie.ts';

/** Signing in with a passkey alone: no username, no password, no code. */
@Public()
@Controller('auth/passkey-login')
export class PasskeyLoginController {
  constructor(
    private readonly assertions: PasskeyAssertionService,
    private readonly sessions: SessionService,
  ) {}

  @Post('options')
  @HttpCode(HttpStatus.OK)
  options(): Promise<PasskeyRequestOptions> {
    return this.assertions.options('signIn');
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async logIn(
    @Body({ schema: passkeyLoginRequestSchema }) body: PasskeyLoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.assertions.verify(body.response, 'signIn');
    const session = await this.sessions.start(request.get('user-agent') ?? '', false);
    writeSessionCookie(response, session);
  }
}
