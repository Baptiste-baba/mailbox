import type { PasskeySummary } from '@mailbox/shared';
import { Dialog, DialogConfirmation } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { IdentityConfirmationForm } from './identity-confirmation-form.tsx';
import { useRemovePasskey } from './use-remove-passkey.ts';

interface RemovePasskeyDialogProps {
  /** The passkey to remove; none while the dialog is closed. */
  passkey: PasskeySummary | undefined;
  onClose: () => void;
}

/** Asks before removing a passkey: it cannot be undone, and the password manager keeps it. */
export function RemovePasskeyDialog({ passkey, onClose }: RemovePasskeyDialogProps) {
  return (
    <Dialog
      open={passkey !== undefined}
      onClose={onClose}
      title={passkey === undefined ? '' : fr.passkey.removeTitle(passkey.name)}
      closeLabel={fr.common.close}
    >
      {passkey !== undefined && <RemovePasskeyConfirmation passkey={passkey} onDone={onClose} />}
    </Dialog>
  );
}

function RemovePasskeyConfirmation({
  passkey,
  onDone,
}: {
  passkey: PasskeySummary;
  onDone: () => void;
}) {
  const removal = useRemovePasskey(passkey.id, onDone);
  if (removal.gate.confirming) {
    // The passkey about to go can still confirm the identity: it is one of the account's.
    return (
      <IdentityConfirmationForm
        withPasskey
        onConfirmed={removal.gate.confirmed}
        onCancel={onDone}
      />
    );
  }
  return (
    <DialogConfirmation
      message={fr.passkey.removeText}
      error={removal.error}
      confirmLabel={fr.passkey.remove}
      cancelLabel={fr.common.cancel}
      onConfirm={removal.remove}
      onCancel={onDone}
      pending={removal.pending}
    />
  );
}
