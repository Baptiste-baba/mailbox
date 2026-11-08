import type { Request, Response } from 'express';
import type { StartedSession } from './session.service.ts';

export const SESSION_COOKIE = 'mailbox_session';

/** The session token sent by the browser, if any. */
export function readSessionToken(_request: Request): string | undefined {
  throw new Error('Not implemented yet');
}

/** Hands the session to the browser in a cookie scripts cannot read, sent back to this site only. */
export function writeSessionCookie(_response: Response, _session: StartedSession): void {
  throw new Error('Not implemented yet');
}

export function clearSessionCookie(_response: Response): void {
  throw new Error('Not implemented yet');
}
