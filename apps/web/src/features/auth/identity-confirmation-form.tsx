import { Alert, Button, DialogActions, Divider, PasswordField } from '@mailbox/ui';
import { KeyRoundIcon } from 'lucide-react';
import { fr } from '../../i18n/fr.ts';
import { passkeysSupported } from './passkey-ceremony.ts';
import { TotpCodeField } from './totp-code-field.tsx';
import { useIdentityConfirmation } from './use-identity-confirmation.ts';

interface IdentityConfirmationFormProps {
  /** The account has a passkey to confirm with. */
  withPasskey: boolean;
  onConfirmed: () => void;
  onCancel: () => void;
}

/** In a dialog, before a change of how one signs in: a passkey, or the password and a code. */
export function IdentityConfirmationForm({
  withPasskey,
  onConfirmed,
  onCancel,
}: IdentityConfirmationFormProps) {
  const form = useIdentityConfirmation(onConfirmed);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        form.submit();
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-center text-ink-2">{fr.identity.intro}</p>
        {withPasskey && passkeysSupported() && (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={form.withPasskey}
              disabled={form.blocked}
            >
              <KeyRoundIcon />
              {fr.identity.withPasskey}
            </Button>
            <Divider label={fr.passkey.or} />
          </>
        )}
        <PasswordField
          label={fr.auth.passwordLabel}
          placeholder={fr.auth.passwordPlaceholder}
          revealLabel={fr.auth.revealPassword}
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
        />
        <TotpCodeField
          value={form.code.code}
          onChange={form.code.changeCode}
          error={form.code.codeError}
          autoFocus={false}
        />
        {form.error !== undefined && <Alert>{form.error}</Alert>}
      </div>
      <DialogActions>
        <Button variant="primary" size="lg" type="submit" disabled={form.blocked}>
          {fr.identity.confirm}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel}>
          {fr.common.cancel}
        </Button>
      </DialogActions>
    </form>
  );
}
