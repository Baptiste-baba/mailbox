import { createGmailProvider, type OauthClient } from '@mailbox/providers';
import { AppError, type MailProvider, type MailProviderName } from '@mailbox/shared';

/** The providers this server is configured for, by name. */
export type MailProviders = ReadonlyMap<MailProviderName, MailProvider>;

export const MAIL_PROVIDERS = Symbol('MAIL_PROVIDERS');

/** @param google The client of this installation at Google; without one, Gmail is left out. */
export function configuredMailProviders(google: OauthClient | undefined): MailProviders {
  const providers = new Map<MailProviderName, MailProvider>();
  if (google !== undefined) {
    providers.set('gmail', createGmailProvider(google));
  }
  return providers;
}

/** @throws AppError MAIL_PROVIDER_NOT_CONFIGURED when this server has no client for the provider. */
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
