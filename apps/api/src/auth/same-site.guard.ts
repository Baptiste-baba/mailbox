import { AppError } from '@mailbox/shared';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/** Methods that only read: a page of another site gains nothing by sending them. */
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** What the browser says of a request sent by this app itself, or typed by the user. */
const OWN_REQUESTS = new Set(['same-origin', 'none']);

/**
 * Refuses a request that changes something when the browser says another site sent it (the
 * Sec-Fetch-Site header of Fetch Metadata). The SameSite cookie already keeps the session out of
 * such requests; this also covers sign-in and setup, which need no session.
 */
@Injectable()
export class SameSiteGuard implements CanActivate {
  /** @throws AppError CROSS_SITE_REQUEST */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const site = request.get('sec-fetch-site');
    // No header: not a browser, or one too old to send it; neither carries a session by surprise.
    if (READ_METHODS.has(request.method) || site === undefined || OWN_REQUESTS.has(site)) {
      return true;
    }
    throw new AppError('CROSS_SITE_REQUEST', 'Requests sent by another site are refused');
  }
}
