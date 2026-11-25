import { createFileRoute } from '@tanstack/react-router';
import {
  MailboxConnectionReturn,
  mailboxConnectionSearchSchema,
} from '../../features/mailboxes/index.ts';

// The path is the one of MAILBOX_CONNECTION_PATH, which providers are given to send users back to.
export const Route = createFileRoute('/_shell/mailbox-connection')({
  validateSearch: mailboxConnectionSearchSchema,
  component: MailboxConnectionPage,
});

function MailboxConnectionPage() {
  const { state, code, error } = Route.useSearch();
  return <MailboxConnectionReturn state={state} code={code} providerError={error} />;
}
