import { SecretBox } from '@mailbox/db';
import { configuredMailProviders } from '@mailbox/providers';
import { type DynamicModule, Module } from '@nestjs/common';
import type { ApiConfig } from '../config/api-config.ts';
import { CONNECTION_REDIRECT_URI, connectionRedirectUri } from './connection-redirect-uri.ts';
import { MAIL_PROVIDERS } from './mail-providers.ts';
import { MailboxConnectionController } from './mailbox-connection.controller.ts';
import { MailboxConnectionService } from './mailbox-connection.service.ts';
import { MailboxRemovalService } from './mailbox-removal.service.ts';
import { MailboxesController } from './mailboxes.controller.ts';
import { MailboxesService } from './mailboxes.service.ts';
import { PendingConnections } from './pending-connections.ts';

@Module({})
class MailboxesModule {}

/** @param config What connecting a mailbox needs of the configuration. */
export function createMailboxesModule(
  config: Pick<ApiConfig, 'appUrl' | 'google' | 'secretKey'>,
): DynamicModule {
  return {
    module: MailboxesModule,
    controllers: [MailboxConnectionController, MailboxesController],
    providers: [
      { provide: CONNECTION_REDIRECT_URI, useValue: connectionRedirectUri(config.appUrl) },
      { provide: MAIL_PROVIDERS, useValue: configuredMailProviders(config.google) },
      MailboxConnectionService,
      MailboxRemovalService,
      MailboxesService,
      PendingConnections,
      { provide: SecretBox, useFactory: () => new SecretBox(config.secretKey) },
    ],
  };
}
