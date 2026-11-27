import { type DynamicModule, Module } from '@nestjs/common';
import { EventsController } from './events.controller.ts';
import { EVENTS_DATABASE_URL, MailboxChangesService } from './mailbox-changes.service.ts';

@Module({})
class EventsModule {}

/** @param databaseUrl Where the changes are listened to, on a connection of their own. */
export function createEventsModule(databaseUrl: string): DynamicModule {
  return {
    module: EventsModule,
    controllers: [EventsController],
    providers: [{ provide: EVENTS_DATABASE_URL, useValue: databaseUrl }, MailboxChangesService],
  };
}
