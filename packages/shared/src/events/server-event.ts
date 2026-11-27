import * as z from 'zod';
import { mailboxIdSchema } from '../mail/mailbox-connection.ts';

/** Where the app listens to what changes on the server, as server-sent events. */
export const SERVER_EVENTS_PATH = '/events';

/** What the server tells the app as it happens. The app reads again what it shows. */
export const serverEventSchema = z.discriminatedUnion('type', [
  z.object({
    /** The mail or the state of a mailbox changed. */
    type: z.literal('mailboxChanged'),
    mailboxId: mailboxIdSchema,
  }),
  z.object({
    /** The server may have missed changes: everything shown is to be read again. */
    type: z.literal('resync'),
  }),
  z.object({
    /** Keeps the connection open through proxies that close a silent one: nothing to do. */
    type: z.literal('heartbeat'),
  }),
]);

export type ServerEvent = z.infer<typeof serverEventSchema>;
