import type {
  AuthorizationCode,
  AuthorizationRequest,
  MailProvider,
  ProviderGrant,
} from '@mailbox/shared';
import type { OauthClient } from '../oauth-client.ts';

/** Gmail, personal or Google Workspace, read through the Gmail API. */
export function createGmailProvider(_client: OauthClient): MailProvider {
  return {
    authorizationUrl(_request: AuthorizationRequest): string {
      throw new Error('Not implemented yet');
    },
    redeem(_code: AuthorizationCode): Promise<ProviderGrant> {
      throw new Error('Not implemented yet');
    },
    revoke(_refreshToken: string): Promise<void> {
      throw new Error('Not implemented yet');
    },
  };
}
