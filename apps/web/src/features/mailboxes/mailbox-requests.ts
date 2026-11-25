import { type MailboxConnectionRequest, mailboxAuthorizationSchema } from '@mailbox/shared';
import { postApi } from '../../api/fetch-api.ts';

/** Starts adding a mailbox: the api answers the page of the provider where to sign in. */
export function startMailboxConnection(request: MailboxConnectionRequest) {
  return postApi('/mailboxes/connection', request, mailboxAuthorizationSchema);
}
