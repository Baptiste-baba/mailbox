import { SERVER_EVENTS_PATH } from '@mailbox/shared';
import { Controller, type MessageEvent, Sse } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { MailboxChangesService } from './mailbox-changes.service.ts';

/** What changes on the server, told to the app as it happens. */
@Controller()
export class EventsController {
  constructor(private readonly mailboxChanges: MailboxChangesService) {}

  @Sse(SERVER_EVENTS_PATH)
  events(): Observable<MessageEvent> {
    return this.mailboxChanges.events.pipe(map((event) => ({ data: event })));
  }
}
