import { MAILBOX_CONNECTION_PATH } from '@mailbox/shared';
import type { AppUrl } from '../config/app-url.ts';

export const CONNECTION_REDIRECT_URI = Symbol('CONNECTION_REDIRECT_URI');

/**
 * Where a provider sends the browser back once the user signed in there: a page of the web app,
 * not the api. The session cookie does not travel with a navigation coming from another site, so
 * that page is the one handing the code over to the api, from the app itself.
 */
export function connectionRedirectUri(appUrl: AppUrl): string {
  return `${appUrl.origin}${MAILBOX_CONNECTION_PATH}`;
}
