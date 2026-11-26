import type { MailProvider } from '@mailbox/shared';
import type { OauthClient } from '../oauth-client.ts';
import { googleAuthorizationUrl } from './google-authorization-url.ts';
import { redeemGoogleCode } from './redeem-google-code.ts';
import { renewGoogleAccess } from './renew-google-access.ts';
import { revokeGoogleToken } from './revoke-google-token.ts';

/** Gmail, personal or Google Workspace, read through the Gmail API. */
export function createGmailProvider(client: OauthClient): MailProvider {
  return {
    authorizationUrl: (request) => googleAuthorizationUrl(client.clientId, request),
    redeem: (code) => redeemGoogleCode(client, code),
    renewAccess: (refreshToken) => renewGoogleAccess(client, refreshToken),
    revoke: revokeGoogleToken,
  };
}
