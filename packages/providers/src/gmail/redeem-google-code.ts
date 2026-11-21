import { AppError, type AuthorizationCode, type ProviderGrant } from '@mailbox/shared';
import { readAnswer } from '../http/read-answer.ts';
import { sendRequest } from '../http/send-request.ts';
import type { OauthClient } from '../oauth-client.ts';
import { GMAIL_READ_SCOPE } from './gmail-read-scope.ts';
import { googleTokenGrantSchema, googleTokenRefusalSchema } from './google-token-answers.ts';
import { readGmailAddress } from './read-gmail-address.ts';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Redeems the code Google sent the user back with, and tells which account it was for.
 * @throws AppError MAILBOX_CONNECTION_FAILED when Google refuses the code or the client, or
 * grants less than a lasting read access to the mail.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function redeemGoogleCode(
  client: OauthClient,
  code: AuthorizationCode,
): Promise<ProviderGrant> {
  const response = await sendRequest(TOKEN_ENDPOINT, {
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
    throw new AppError('MAILBOX_CONNECTION_FAILED', await refusalMessage(response));
  }
  const grant = await readAnswer(response, googleTokenGrantSchema);
  if (grant.refresh_token === undefined) {
    throw new AppError('MAILBOX_CONNECTION_FAILED', 'Google granted no lasting access');
  }
  if (!grant.scope.split(' ').includes(GMAIL_READ_SCOPE)) {
    throw new AppError('MAILBOX_CONNECTION_FAILED', 'Google granted no read access to the mail');
  }
  return {
    address: await readGmailAddress(grant.access_token),
    refreshToken: grant.refresh_token,
  };
}

async function refusalMessage(response: Response): Promise<string> {
  // A refusal whose body cannot be read is still a refusal: only its reason is lost.
  const body: unknown = await response.json().catch(() => undefined);
  const refusal = googleTokenRefusalSchema.safeParse(body);
  const reason = refusal.success ? refusal.data.error : `HTTP ${response.status}`;
  return `Google refused the code (${reason})`;
}
