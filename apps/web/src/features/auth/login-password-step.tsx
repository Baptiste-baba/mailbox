import { Button, Divider, PasswordField, TextField } from '@mailbox/ui';
import { KeyRoundIcon } from 'lucide-react';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { usePasskeyLogin } from './use-passkey-login.ts';
import { type PasswordLoginOptions, usePasswordLogin } from './use-password-login.ts';

interface LoginPasswordStepProps extends PasswordLoginOptions {
  /** Signed in with a passkey, without the password. */
  onSignedIn: () => void;
}

/**
 * The username and password, which a password manager recognises and fills, or else a passkey
 * alone: from the button, or picked among the suggestions of the username field.
 */
export function LoginPasswordStep({ onSignedIn, ...options }: LoginPasswordStepProps) {
  const form = usePasswordLogin(options);
  const passkey = usePasskeyLogin(onSignedIn, { suggest: true, onError: form.showError });
  return (
    <AuthStepLayout
      onSubmit={form.submit}
      error={form.error}
      actions={
        <>
          <Button variant="primary" size="lg" type="submit" disabled={form.blocked}>
            {fr.common.continue}
          </Button>
          {passkey.supported && (
            <div className="mt-4 flex flex-col gap-4">
              <Divider label={fr.passkey.or} />
              <Button
                variant="secondary"
                size="lg"
                onClick={passkey.start}
                disabled={passkey.pending}
              >
                <KeyRoundIcon />
                {fr.passkey.signIn}
              </Button>
            </div>
          )}
        </>
      }
    >
      <TextField
        label={fr.auth.usernameLabel}
        placeholder={fr.auth.usernamePlaceholder}
        value={form.values.username}
        onChange={(event) => form.set.username(event.target.value)}
        // A password manager suggests the app's passkeys here too: one tap signs in.
        autoComplete="username webauthn"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
      />
      <PasswordField
        label={fr.auth.passwordLabel}
        placeholder={fr.auth.passwordPlaceholder}
        revealLabel={fr.auth.revealPassword}
        value={form.values.password}
        onChange={(event) => form.set.password(event.target.value)}
        autoComplete="current-password"
      />
    </AuthStepLayout>
  );
}
