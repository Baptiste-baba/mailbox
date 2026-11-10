import { AppError } from '@mailbox/shared';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { AUTHENTICATOR_REPLACEMENT_ROUTE } from './authenticator-replacement.decorator.ts';
import { IS_PUBLIC } from './public.decorator.ts';
import { SessionService } from './session.service.ts';
import { readSessionToken, writeSessionCookie } from './session-cookie.ts';

/**
 * Refuses every request without a valid session, except on routes marked `@Public()`. A request
 * with a session pushes its end back now and then, and the cookie follows. A session opened with a
 * recovery code only reaches the routes that replace the authenticator app, and only such a session
 * reaches them.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  /**
   * @throws AppError UNAUTHENTICATED without a session, or when it expired;
   * AUTHENTICATOR_REPLACEMENT_REQUIRED for a session that must replace its authenticator app first;
   * AUTHENTICATOR_REPLACEMENT_NOT_REQUIRED for any other session on the replacement routes.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isMarked(context, IS_PUBLIC)) {
      return true;
    }
    const http = context.switchToHttp();
    const token = readSessionToken(http.getRequest<Request>());
    const session = token === undefined ? undefined : await this.sessions.resume(token);
    if (session === undefined) {
      throw new AppError('UNAUTHENTICATED', 'Sign in first');
    }
    if (session.renewed) {
      writeSessionCookie(http.getResponse<Response>(), session);
    }
    const replacementRoute = this.isMarked(context, AUTHENTICATOR_REPLACEMENT_ROUTE);
    if (session.mustReplaceAuthenticator && !replacementRoute) {
      throw new AppError(
        'AUTHENTICATOR_REPLACEMENT_REQUIRED',
        'Set up a new authenticator app first',
      );
    }
    if (!session.mustReplaceAuthenticator && replacementRoute) {
      throw new AppError(
        'AUTHENTICATOR_REPLACEMENT_NOT_REQUIRED',
        'Only a session opened with a recovery code replaces the authenticator app',
      );
    }
    return true;
  }

  private isMarked(context: ExecutionContext, metadataKey: string): boolean {
    const marked = this.reflector.getAllAndOverride<boolean | undefined>(metadataKey, [
      context.getHandler(),
      context.getClass(),
    ]);
    return marked === true;
  }
}
