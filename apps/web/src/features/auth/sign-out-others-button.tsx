import { Button, Dialog, DialogConfirmation } from '@mailbox/ui';
import { MonitorSmartphoneIcon } from 'lucide-react';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { IdentityConfirmationForm } from './identity-confirmation-form.tsx';
import { logOutOthers } from './login-requests.ts';
import { useIdentityGatedAction } from './use-identity-gated-action.ts';

/** Signing out every other device, once confirmed: this one stays signed in. */
export function SignOutOthersButton({ onSignedOut }: { onSignedOut: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const close = () => setConfirming(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        <MonitorSmartphoneIcon />
        {fr.signOut.others}
      </Button>
      <Dialog
        open={confirming}
        onClose={close}
        title={fr.signOut.othersTitle}
        closeLabel={fr.common.close}
      >
        <SignOutOthersConfirmation
          onCancel={close}
          onSignedOut={() => {
            close();
            onSignedOut();
          }}
        />
      </Dialog>
    </>
  );
}

interface SignOutOthersConfirmationProps {
  onCancel: () => void;
  onSignedOut: () => void;
}

// Only there while the dialog is open: a former failure is gone when it opens again.
function SignOutOthersConfirmation({ onCancel, onSignedOut }: SignOutOthersConfirmationProps) {
  const signOut = useIdentityGatedAction({
    mutationFn: logOutOthers,
    onSuccess: onSignedOut,
    errorMessage: authErrorMessage,
  });
  if (signOut.confirming) {
    return <IdentityConfirmationForm onConfirmed={signOut.confirmed} onCancel={onCancel} />;
  }
  return (
    <DialogConfirmation
      message={fr.signOut.othersText}
      error={signOut.error}
      confirmLabel={fr.signOut.othersAction}
      cancelLabel={fr.common.cancel}
      onConfirm={() => signOut.run()}
      onCancel={onCancel}
      pending={signOut.pending}
    />
  );
}
