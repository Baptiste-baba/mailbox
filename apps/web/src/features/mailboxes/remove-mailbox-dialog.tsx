import type { MailboxSummary } from '@mailbox/shared';
import { Dialog, DialogConfirmation } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { IdentityConfirmationForm } from '../auth/index.ts';
import { useRemoveMailbox } from './use-remove-mailbox.ts';

interface RemoveMailboxDialogProps {
  /** The mailbox to remove; none while the dialog is closed. */
  mailbox: MailboxSummary | undefined;
  onClose: () => void;
}

/** Asks before removing a mailbox: its mail leaves MailBox, and stays at the provider. */
export function RemoveMailboxDialog({ mailbox, onClose }: RemoveMailboxDialogProps) {
  return (
    <Dialog
      open={mailbox !== undefined}
      onClose={onClose}
      title={mailbox === undefined ? '' : fr.mailboxes.removeTitle(mailbox.name)}
      closeLabel={fr.common.close}
    >
      {mailbox !== undefined && <RemoveMailboxConfirmation mailbox={mailbox} onDone={onClose} />}
    </Dialog>
  );
}

function RemoveMailboxConfirmation({
  mailbox,
  onDone,
}: {
  mailbox: MailboxSummary;
  onDone: () => void;
}) {
  const removal = useRemoveMailbox(mailbox.id, onDone);
  if (removal.confirming) {
    return (
      <IdentityConfirmationForm
        intro={fr.mailboxes.confirmIdentityToRemove}
        onConfirmed={removal.confirmed}
        onCancel={onDone}
      />
    );
  }
  return (
    <DialogConfirmation
      message={fr.mailboxes.removeText}
      error={removal.error}
      confirmLabel={fr.mailboxes.remove}
      cancelLabel={fr.common.cancel}
      onConfirm={() => removal.run()}
      onCancel={onDone}
      pending={removal.pending}
    />
  );
}
