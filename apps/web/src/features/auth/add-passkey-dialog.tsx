import { Alert, Button, Dialog, DialogActions, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { IdentityConfirmationForm } from './identity-confirmation-form.tsx';
import { useAddPasskey } from './use-add-passkey.ts';

export function AddPasskeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={fr.passkey.add} closeLabel={fr.common.close}>
      <AddPasskeyForm onDone={onClose} />
    </Dialog>
  );
}

// Only there while the dialog is open: each addition starts afresh.
function AddPasskeyForm({ onDone }: { onDone: () => void }) {
  const form = useAddPasskey(onDone);
  if (form.confirming) {
    return <IdentityConfirmationForm onConfirmed={form.confirmed} onCancel={onDone} />;
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.submit();
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-center text-ink-2">{fr.passkey.addIntro}</p>
        <TextField
          label={fr.passkey.nameLabel}
          placeholder={fr.passkey.namePlaceholder}
          value={form.name}
          onChange={(event) => form.changeName(event.target.value)}
          error={form.nameError}
          maxLength={64}
          autoComplete="off"
        />
        {form.error !== undefined && <Alert>{form.error}</Alert>}
      </div>
      <DialogActions>
        <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
          {fr.passkey.create}
        </Button>
        <Button variant="secondary" size="lg" onClick={onDone}>
          {fr.common.cancel}
        </Button>
      </DialogActions>
    </form>
  );
}
