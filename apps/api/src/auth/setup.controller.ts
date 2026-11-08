import {
  type SetupCodeRequest,
  type SetupRequest,
  type SetupResponse,
  setupCodeRequestSchema,
  setupRequestSchema,
  type TotpEnrollment,
} from '@mailbox/shared';
import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from './public.decorator.ts';
import { SetupService } from './setup.service.ts';

@Controller('auth/setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Public()
  @Post('totp-secret')
  @HttpCode(HttpStatus.OK)
  startTotpEnrollment(
    @Body({ schema: setupCodeRequestSchema }) request: SetupCodeRequest,
  ): Promise<TotpEnrollment> {
    return this.setup.startTotpEnrollment(request.setupCode);
  }

  @Public()
  @Post()
  createAccount(
    @Body({ schema: setupRequestSchema }) request: SetupRequest,
    @Res({ passthrough: true }) _response: Response,
  ): Promise<SetupResponse> {
    return this.setup.createAccount(request);
  }
}
