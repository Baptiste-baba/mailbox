import { AppError } from '@mailbox/shared';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { IS_PUBLIC } from './public.decorator.ts';
import { SessionService } from './session.service.ts';
import { readSessionToken, writeSessionCookie } from './session-cookie.ts';

/**
 * Refuses every request without a valid session, except on routes marked `@Public()`. A request
 * with a session pushes its end back, and the cookie follows.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  /** @throws AppError UNAUTHENTICATED without a session, or when it expired. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic === true) {
      return true;
    }
    const http = context.switchToHttp();
    const token = readSessionToken(http.getRequest<Request>());
    const session = token === undefined ? undefined : await this.sessions.resume(token);
    if (session === undefined) {
      throw new AppError('UNAUTHENTICATED', 'Sign in first');
    }
    writeSessionCookie(http.getResponse<Response>(), session);
    return true;
  }
}
