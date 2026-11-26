import {
  type AppError,
  type AuthorizationCode,
  mailboxConnectionFailure,
  type ProviderGrant,
} from '@mailbox/shared';
import { readAnswer } from '../http/read-answer.ts';
import { sendRequest } from '../http/send-request.ts';
import type { OauthClient } from '../oauth-client.ts';
import { GMAIL_READ_SCOPE } from './gmail-read-scope.ts';
import { googleTokenGrantSchema } from './google-token-answers.ts';
import { GOOGLE_TOKEN_ENDPOINT } from './google-token-endpoint.ts';
import { readGmailAddress } from './read-gmail-address.ts';
import { readGoogleTokenRefusal } from './read-google-token-refusal.ts';

/**
 * Redeems the code Google sent the user back with, and tells which account it was for.
 * @throws AppError MAILBOX_CONNECTION_FAILED when Google refuses the code or the client, grants
 * less than a lasting read access to the mail, or will not tell which account signed in.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function redeemGoogleCode(
  client: OauthClient,
  code: AuthorizationCode,
): Promise<ProviderGrant> {
  const response = await sendRequest(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams([
      ['grant_type', 'authorization_code'],
      ['code', code.code],
      ['code_verifier', code.codeVerifier],
      ['redirect_uri', code.redirectUri],
      ['client_id', client.clientId],
      ['client_secret', client.clientSecret],
    ]),
  });
  if (!response.ok) {
    throw await refusal(response);
  }
  const grant = await readAnswer(response, googleTokenGrantSchema);
  if (grant.refresh_token === undefined) {
    throw mailboxConnectionFailure('accessNotGranted', 'Google granted no lasting access');
  }
  if (!grant.scope.split(' ').includes(GMAIL_READ_SCOPE)) {
    throw mailboxConnectionFailure('accessNotGranted', 'Google granted no read access to the mail');
  }
  return {
    address: await readGmailAddress(grant.access_token),
    refreshToken: grant.refresh_token,
  };
}

// The codes by which Google says it does not accept the client itself, whatever the code.
const CLIENT_REFUSALS = new Set(['invalid_client', 'unauthorized_client', 'deleted_client']);

async function refusal(response: Response): Promise<AppError> {
  const said = await readGoogleTokenRefusal(response);
  if (said === undefined) {
    const status = `HTTP ${response.status}`;
    return mailboxConnectionFailure('codeRefused', `Google refused the code (${status})`, status);
  }
  const { error, error_description: description } = said;
  return mailboxConnectionFailure(
    CLIENT_REFUSALS.has(error) ? 'clientRefused' : 'codeRefused',
    `Google refused the code (${error})`,
    description === undefined ? error : `${error}: ${description}`,
  );
}
