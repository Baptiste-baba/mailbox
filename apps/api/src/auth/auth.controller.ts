import {
  type AuthStatus,
  type LoginRequest,
  type LoginResponse,
  loginRequestSchema,
} from '@mailbox/shared';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginService } from './login.service.ts';
import { Public } from './public.decorator.ts';

@Controller('auth')
export class AuthController {
  constructor(private readonly login: LoginService) {}

  @Public()
  @Get('status')
  status(@Req() _request: Request): Promise<AuthStatus> {
    throw new Error('Not implemented yet');
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  logIn(
    @Body({ schema: loginRequestSchema }) request: LoginRequest,
    @Res({ passthrough: true }) _response: Response,
  ): Promise<LoginResponse> {
    return this.login.logIn(request);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logOut(@Req() _request: Request, @Res({ passthrough: true }) _response: Response): Promise<void> {
    throw new Error('Not implemented yet');
  }
}
