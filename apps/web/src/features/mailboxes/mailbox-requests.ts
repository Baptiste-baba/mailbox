import {
  type MailboxConnectionCompletion,
  type MailboxConnectionRequest,
  mailboxAuthorizationSchema,
  mailboxSummarySchema,
} from '@mailbox/shared';
import { postApi, sendApi } from '../../api/fetch-api.ts';

/** Starts adding a mailbox: the api answers the page of the provider where to sign in. */
export function startMailboxConnection(request: MailboxConnectionRequest) {
  return postApi('/mailboxes/connection', request, mailboxAuthorizationSchema);
}

/** Starts signing in again to a mailbox whose provider no longer lets MailBox in. */
export function startMailboxReconnection(mailboxId: string) {
  return postApi(
    `/mailboxes/${encodeURIComponent(mailboxId)}/reconnection`,
    undefined,
    mailboxAuthorizationSchema,
  );
}

/** Hands the api what the provider sent the browser back with: the api answers the mailbox. */
export function completeMailboxConnection(completion: MailboxConnectionCompletion) {
  return postApi('/mailboxes/connection/completion', completion, mailboxSummarySchema);
}

/** Ends the access of MailBox at the provider, and removes the mailbox with its mail. */
export function removeMailbox(mailboxId: string) {
  return sendApi('DELETE', `/mailboxes/${encodeURIComponent(mailboxId)}`, undefined);
}
