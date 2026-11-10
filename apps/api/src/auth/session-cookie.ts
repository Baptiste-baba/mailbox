import { AppError } from '@mailbox/shared';
import type { CookieOptions, Request, Response } from 'express';
import type { StartedSession } from './session.service.ts';

// The __Host- prefix makes browsers refuse this cookie unless it is Secure, for the whole site and
// set by this host only: no other site or subdomain can plant or read one.
export const SESSION_COOKIE = '__Host-mailbox_session';

// Never readable by scripts, only sent over HTTPS, and never with a request from another site.
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
};

/** The session token sent by the browser, if any. */
export function readSessionToken(request: Request): string | undefined {
  const prefix = `${SESSION_COOKIE}=`;
  const cookie = request.headers.cookie
    ?.split(';')
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(prefix));
  const token = cookie?.slice(prefix.length);
  return token === '' ? undefined : token;
}

/** The session token of a request the session guard let through, on a route that needs one. */
export function requireSessionToken(request: Request): string {
  const token = readSessionToken(request);
  // The session guard lets no request through without a session: this only narrows the type.
  if (token === undefined) {
    throw new AppError('UNAUTHENTICATED', 'Sign in first');
  }
  return token;
}

/** Hands the session to the browser, until the session itself expires. */
export function writeSessionCookie(response: Response, session: StartedSession): void {
  response.cookie(SESSION_COOKIE, session.token, { ...COOKIE_OPTIONS, expires: session.expiresAt });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
}
