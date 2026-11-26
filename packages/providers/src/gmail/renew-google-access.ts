import { AppError, type ProviderAccess } from '@mailbox/shared';
import { readAnswer } from '../http/read-answer.ts';
import { sendRequest } from '../http/send-request.ts';
import type { OauthClient } from '../oauth-client.ts';
import { googleAccessRenewalSchema } from './google-token-answers.ts';
import { GOOGLE_TOKEN_ENDPOINT } from './google-token-endpoint.ts';
import { readGoogleTokenRefusal } from './read-google-token-refusal.ts';

/** How Google says a refresh token no longer works: expired, or withdrawn by the user. */
const TOKEN_NO_LONGER_ACCEPTED = 'invalid_grant';
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Asks Google for a new access to the mail of an account, with the token kept since the user
 * signed in.
 * @throws AppError MAILBOX_RECONNECTION_REQUIRED when Google no longer accepts that token.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE when Google cannot be reached, or refuses for another
 * reason, such as a client of this installation it no longer knows.
 */
export async function renewGoogleAccess(
  client: OauthClient,
  refreshToken: string,
): Promise<ProviderAccess> {
  const askedAt = Date.now();
  const response = await sendRequest(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams([
      ['grant_type', 'refresh_token'],
      ['refresh_token', refreshToken],
      ['client_id', client.clientId],
      ['client_secret', client.clientSecret],
    ]),
  });
  if (!response.ok) {
    throw await refusal(response);
  }
  const renewal = await readAnswer(response, googleAccessRenewalSchema);
  return {
    accessToken: renewal.access_token,
    // Counted from before the request: the access never looks valid longer than it is.
    expiresAt: new Date(askedAt + renewal.expires_in * MILLISECONDS_PER_SECOND),
  };
}

async function refusal(response: Response): Promise<AppError> {
  const reason = (await readGoogleTokenRefusal(response))?.error ?? `HTTP ${response.status}`;
  return reason === TOKEN_NO_LONGER_ACCEPTED
    ? new AppError(
        'MAILBOX_RECONNECTION_REQUIRED',
        'Google no longer accepts the access kept for the mailbox',
      )
    : new AppError('MAIL_PROVIDER_UNAVAILABLE', `Google refused to renew the access (${reason})`);
}
