import { MAILBOX_NAME_MAX_LENGTH } from '@mailbox/shared';
import { Alert, Button, Dialog, DialogActions, SwatchPicker, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { IdentityConfirmationForm } from '../auth/index.ts';
import { mailboxColors } from './mailbox-colors.ts';
import { useAddMailbox } from './use-add-mailbox.ts';

export function AddMailboxDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={fr.mailboxes.addTitle}
      closeLabel={fr.common.close}
    >
      <AddMailboxForm onCancel={onClose} />
    </Dialog>
  );
}

// Only there while the dialog is open: each addition starts afresh.
function AddMailboxForm({ onCancel }: { onCancel: () => void }) {
  const form = useAddMailbox();
  if (form.confirming) {
    return (
      <IdentityConfirmationForm
        intro={fr.mailboxes.confirmIdentity}
        onConfirmed={form.confirmed}
        onCancel={onCancel}
      />
    );
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
        <p className="text-center text-ink-2">{fr.mailboxes.addIntro}</p>
        <TextField
          label={fr.mailboxes.nameLabel}
          placeholder={fr.mailboxes.namePlaceholder}
          value={form.name}
          onChange={(event) => form.changeName(event.target.value)}
          error={form.nameError}
          maxLength={MAILBOX_NAME_MAX_LENGTH}
          autoComplete="off"
        />
        <SwatchPicker
          label={fr.mailboxes.colorLabel}
          options={mailboxColors}
          value={form.color}
          onChange={form.changeColor}
        />
        {form.error !== undefined && <Alert>{form.error}</Alert>}
      </div>
      <DialogActions>
        <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
          {fr.mailboxes.continueAtGoogle}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel}>
          {fr.common.cancel}
        </Button>
      </DialogActions>
    </form>
  );
}
