import {
  type AuthStatus,
  type LoginRequest,
  type LoginResponse,
  loginRequestSchema,
} from '@mailbox/shared';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { clientAddress } from './client-address.ts';
import { LoginService } from './login.service.ts';
import { Public } from './public.decorator.ts';
import { SessionService } from './session.service.ts';
import { clearSessionCookie, readSessionToken, writeSessionCookie } from './session-cookie.ts';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: LoginService,
    private readonly sessions: SessionService,
  ) {}

  @Public()
  @Get('status')
  async status(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthStatus> {
    const token = readSessionToken(request);
    const { status, renewedSession } = await this.login.status(token);
    if (renewedSession !== undefined) {
      writeSessionCookie(response, renewedSession);
    } else if (token !== undefined) {
      // The session expired or was ended elsewhere: the browser forgets its cookie.
      clearSessionCookie(response);
    }
    return status;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async logIn(
    @Body({ schema: loginRequestSchema }) body: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const result = await this.login.logIn(
      body,
      clientAddress(request),
      request.get('user-agent') ?? '',
    );
    writeSessionCookie(response, result.session);
    return result.response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logOut(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = readSessionToken(request);
    if (token !== undefined) {
      await this.sessions.end(token);
    }
    clearSessionCookie(response);
  }
}
