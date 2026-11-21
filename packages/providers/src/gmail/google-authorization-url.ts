import type { AuthorizationRequest } from '@mailbox/shared';
import { GMAIL_READ_SCOPE } from './gmail-read-scope.ts';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

/** The page of Google where the user signs in and lets this installation read their mail. */
export function googleAuthorizationUrl(clientId: string, request: AuthorizationRequest): string {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  const parameters = [
    ['client_id', clientId],
    ['redirect_uri', request.redirectUri],
    ['response_type', 'code'],
    ['scope', GMAIL_READ_SCOPE],
    ['state', request.state],
    ['code_challenge', request.codeChallenge],
    ['code_challenge_method', 'S256'],
    // Both are needed for a refresh token: Google only gives one for offline access, and on its
    // own only the first time an account consents, which a reconnection is not.
    ['access_type', 'offline'],
    ['prompt', 'consent'],
  ];
  if (request.loginHint !== undefined) {
    parameters.push(['login_hint', request.loginHint]);
  }
  url.search = new URLSearchParams(parameters).toString();
  return url.toString();
}
