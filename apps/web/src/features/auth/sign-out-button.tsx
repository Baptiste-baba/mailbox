import { Button, Dialog, DialogConfirmation } from '@mailbox/ui';
import { LogOutIcon } from 'lucide-react';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { useSignOut } from './use-sign-out.ts';

/**
 * Signing out of this device, once confirmed: coming back takes the password and a second factor,
 * a misclick would cost them.
 */
export function SignOutButton() {
  const [confirming, setConfirming] = useState(false);
  const close = () => setConfirming(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        <LogOutIcon />
        {fr.signOut.action}
      </Button>
      <Dialog
        open={confirming}
        onClose={close}
        title={fr.signOut.confirmTitle}
        closeLabel={fr.common.close}
      >
        <SignOutConfirmation onCancel={close} />
      </Dialog>
    </>
  );
}

// Only there while the dialog is open: a former failure is gone when it opens again.
function SignOutConfirmation({ onCancel }: { onCancel: () => void }) {
  const signOut = useSignOut();
  return (
    <DialogConfirmation
      message={fr.signOut.confirmText}
      error={signOut.error}
      confirmLabel={fr.signOut.action}
      cancelLabel={fr.common.cancel}
      onConfirm={signOut.signOut}
      onCancel={onCancel}
      pending={signOut.pending}
    />
  );
}
