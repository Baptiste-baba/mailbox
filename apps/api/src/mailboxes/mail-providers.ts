import type { OauthClient } from '@mailbox/providers';
import type { MailProvider, MailProviderName } from '@mailbox/shared';

/** The providers this server is configured for, by name. */
export type MailProviders = ReadonlyMap<MailProviderName, MailProvider>;

export const MAIL_PROVIDERS = Symbol('MAIL_PROVIDERS');

/** @param google The client of this installation at Google; without one, Gmail is left out. */
export function configuredMailProviders(_google: OauthClient | undefined): MailProviders {
  throw new Error('Not implemented yet');
}
