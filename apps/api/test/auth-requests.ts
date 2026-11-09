import { authStatusSchema, errorResponseSchema } from '@mailbox/shared';
import { SESSION_COOKIE } from '../src/auth/session-cookie.ts';
import type { RunningApi } from './start-api.ts';

/**
 * Calls an authentication route as the web app does. Node's fetch keeps no cookies: the session
 * cookie, when given, is sent by hand. A string body is sent as is, to test malformed ones. A
 * `forwardedFor` address poses as a proxy relaying for that device.
 */
export function callAuth(
  api: RunningApi,
  method: string,
  path: string,
  options: { body?: unknown; cookie?: string | undefined; forwardedFor?: string } = {},
): Promise<Response> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (options.cookie !== undefined) {
    headers.set('cookie', options.cookie);
  }
  if (options.forwardedFor !== undefined) {
    headers.set('x-forwarded-for', options.forwardedFor);
  }
  const init: RequestInit = { method, headers };
  if (options.body !== undefined) {
    init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  return fetch(`${api.url}/api/auth${path}`, init);
}

/** The authentication status the api gives a session, or nobody without a cookie. */
export async function authStatusOf(api: RunningApi, cookie?: string) {
  const response = await callAuth(api, 'GET', '/status', { cookie });
  return { response, status: authStatusSchema.parse(await response.json()) };
}

export async function errorCode(response: Response): Promise<string> {
  return errorResponseSchema.parse(await response.json()).code;
}

/** The `Set-Cookie` of the session in a response, if any. */
export function sessionSetCookie(response: Response): string | undefined {
  return response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
}

/** The `Cookie` header a browser would send back after this response. */
export function sessionCookieFrom(response: Response): string {
  const setCookie = sessionSetCookie(response);
  if (setCookie === undefined) {
    throw new Error('The response sets no session cookie');
  }
  return setCookie.split(';')[0] ?? '';
}
