import { Button } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import {
  type ConnectionFailureMessage,
  connectionFailureMessage,
  providerRefusalMessage,
} from './connection-failure-message.ts';
import { mailboxConnectionQuery } from './mailbox-connection-query.ts';

interface MailboxConnectionReturnProps {
  /** What the provider sent the browser back with. */
  state: string | undefined;
  code: string | undefined;
  providerError: string | undefined;
}

/**
 * Where a provider sends the browser back once the user signed in there: the connection is
 * finished with the api, then the settings show the mailbox. When it cannot be, the page says why.
 */
export function MailboxConnectionReturn({
  state,
  code,
  providerError,
}: MailboxConnectionReturnProps) {
  if (state !== undefined && code !== undefined) {
    return <ConnectionCompletion state={state} code={code} />;
  }
  // Opened by hand, with nothing of a provider in the address: there is no connection to speak of.
  return providerError === undefined ? (
    <Navigate to="/settings" replace />
  ) : (
    <ConnectionFailure failure={providerRefusalMessage(providerError)} />
  );
}

function ConnectionCompletion({ state, code }: { state: string; code: string }) {
  const completion = useQuery(mailboxConnectionQuery({ state, code }));
  if (completion.isSuccess) {
    return <Navigate to="/settings" replace />;
  }
  if (completion.isError) {
    return <ConnectionFailure failure={connectionFailureMessage(completion.error)} />;
  }
  return (
    <main className="grid h-full place-items-center bg-page p-6">
      <p role="status" className="text-ink-2">
        {fr.mailboxes.connecting}
      </p>
    </main>
  );
}

function ConnectionFailure({ failure }: { failure: ConnectionFailureMessage }) {
  const navigate = useNavigate();
  return (
    <main className="grid h-full place-items-center bg-page p-6">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <p role="alert" className="text-ink">
          {failure.message}
        </p>
        {failure.providerDetail !== undefined && (
          <p className="text-small text-ink-2">
            {fr.mailboxes.providerDetail(failure.providerDetail)}
          </p>
        )}
        <Button variant="secondary" onClick={() => navigate({ to: '/settings' })} className="mt-2">
          {fr.mailboxes.backToSettings}
        </Button>
      </div>
    </main>
  );
}
