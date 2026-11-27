import { AppError, type MailProvider, type MailProviderName } from '@mailbox/shared';
import { createGmailProvider } from './gmail/gmail-provider.ts';
import type { OauthClient } from './oauth-client.ts';

/** The providers a server is configured for, by name. */
export type MailProviders = ReadonlyMap<MailProviderName, MailProvider>;

/** @param google The client of the installation at Google; without one, Gmail is left out. */
export function configuredMailProviders(google: OauthClient | undefined): MailProviders {
  const providers = new Map<MailProviderName, MailProvider>();
  if (google !== undefined) {
    providers.set('gmail', createGmailProvider(google));
  }
  return providers;
}

/** @throws AppError MAIL_PROVIDER_NOT_CONFIGURED when the server has no client for the provider. */
export function requireMailProvider(
  providers: MailProviders,
  name: MailProviderName,
): MailProvider {
  const provider = providers.get(name);
  if (provider === undefined) {
    throw new AppError('MAIL_PROVIDER_NOT_CONFIGURED', `This server has no client for ${name}`);
  }
  return provider;
}
