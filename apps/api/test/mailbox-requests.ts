import { mailboxAuthorizationSchema } from '@mailbox/shared';
import type { RunningApi } from './start-api.ts';

/** The Google client of the test api: the fake Google accepts any. */
export const TEST_GOOGLE_CLIENT = {
  GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'test-client-secret',
};

export const NEW_MAILBOX = { provider: 'gmail', name: 'Perso', color: 'azur' };

/** A caller of the api: the running api, and the `Cookie` header of its session if it has one. */
export interface ApiCaller {
  api: RunningApi;
  cookie?: string | undefined;
}

/** Calls a route of the api as the web app does, with the session of the caller. */
export function callApi(
  { api, cookie }: ApiCaller,
  method: string,
  path: string,
  body?: unknown,
): Promise<Response> {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (cookie !== undefined) {
    headers.set('cookie', cookie);
  }
  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return fetch(`${api.url}/api${path}`, init);
}

/** Starts a connection at `path`: the page of the provider the api sends the user to. */
export async function startConnection(
  caller: ApiCaller,
  path = '/mailboxes/connection',
  body: unknown = NEW_MAILBOX,
): Promise<URL> {
  const response = await callApi(caller, 'POST', path, body);
  return new URL(mailboxAuthorizationSchema.parse(await response.json()).authorizationUrl);
}

/** Hands the api what the provider sends the browser back with, once the user signed in there. */
export function completeConnection(caller: ApiCaller, authorizationUrl: URL): Promise<Response> {
  return callApi(caller, 'POST', '/mailboxes/connection/completion', {
    state: authorizationUrl.searchParams.get('state'),
    code: 'code-of-the-provider',
  });
}
