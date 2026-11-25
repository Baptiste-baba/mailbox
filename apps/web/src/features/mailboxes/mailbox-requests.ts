import {
  type MailboxConnectionCompletion,
  type MailboxConnectionRequest,
  mailboxAuthorizationSchema,
  mailboxSummarySchema,
} from '@mailbox/shared';
import { postApi } from '../../api/fetch-api.ts';

/** Starts adding a mailbox: the api answers the page of the provider where to sign in. */
export function startMailboxConnection(request: MailboxConnectionRequest) {
  return postApi('/mailboxes/connection', request, mailboxAuthorizationSchema);
}

/** Hands the api what the provider sent the browser back with: the api answers the mailbox. */
export function completeMailboxConnection(completion: MailboxConnectionCompletion) {
  return postApi('/mailboxes/connection/completion', completion, mailboxSummarySchema);
}
