import { Button, PasswordField, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { type PasswordLoginOptions, usePasswordLogin } from './use-password-login.ts';

/** The username and password; a password manager recognises and fills them. */
export function LoginPasswordStep(options: PasswordLoginOptions) {
  const form = usePasswordLogin(options);
  return (
    <AuthStepLayout
      onSubmit={form.submit}
      error={form.error}
      actions={
        <Button variant="primary" size="lg" type="submit" disabled={form.blocked}>
          {fr.common.continue}
        </Button>
      }
    >
      <TextField
        label={fr.auth.usernameLabel}
        value={form.values.username}
        onChange={(event) => form.set.username(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
      />
      <PasswordField
        label={fr.auth.passwordLabel}
        revealLabel={fr.auth.revealPassword}
        value={form.values.password}
        onChange={(event) => form.set.password(event.target.value)}
        autoComplete="current-password"
      />
    </AuthStepLayout>
  );
}
