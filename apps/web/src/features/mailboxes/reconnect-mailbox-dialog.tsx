import type { MailboxSummary } from '@mailbox/shared';
import { Alert, Button, Dialog, DialogActions } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { IdentityConfirmationForm } from '../auth/index.ts';
import { startMailboxReconnection } from './mailbox-requests.ts';
import { useProviderDeparture } from './use-provider-departure.ts';

interface ReconnectMailboxDialogProps {
  /** The mailbox to reconnect; none while the dialog is closed. */
  mailbox: MailboxSummary | undefined;
  onClose: () => void;
}

/** Says with which account to sign in again at the provider, before leaving for it. */
export function ReconnectMailboxDialog({ mailbox, onClose }: ReconnectMailboxDialogProps) {
  return (
    <Dialog
      open={mailbox !== undefined}
      onClose={onClose}
      title={mailbox === undefined ? '' : fr.mailboxes.reconnectMailbox(mailbox.name)}
      closeLabel={fr.common.close}
    >
      {mailbox !== undefined && <MailboxReconnection mailbox={mailbox} onCancel={onClose} />}
    </Dialog>
  );
}

function MailboxReconnection({
  mailbox,
  onCancel,
}: {
  mailbox: MailboxSummary;
  onCancel: () => void;
}) {
  const departure = useProviderDeparture(() => startMailboxReconnection(mailbox.id));
  if (departure.confirming) {
    return (
      <IdentityConfirmationForm
        intro={fr.mailboxes.confirmIdentityToConnect}
        onConfirmed={departure.confirmed}
        onCancel={onCancel}
      />
    );
  }
  return (
    <>
      <p className="text-center text-ink-2">{fr.mailboxes.reconnectIntro(mailbox.address)}</p>
      {departure.error !== undefined && (
        <div className="mt-4">
          <Alert>{departure.error}</Alert>
        </div>
      )}
      <DialogActions>
        <Button
          variant="primary"
          size="lg"
          onClick={() => departure.run()}
          disabled={departure.pending}
        >
          {fr.mailboxes.continueAtGoogle}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel}>
          {fr.common.cancel}
        </Button>
      </DialogActions>
    </>
  );
}
