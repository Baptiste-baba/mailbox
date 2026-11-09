import { Button, PasswordField, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import type { PasswordScore } from './password-checker.ts';
import { PasswordStrengthBars } from './password-strength.tsx';
import {
  MIN_PASSWORD_SCORE,
  type SetupAccountForm,
  type SetupAccountFormOptions,
  useSetupAccountForm,
} from './use-setup-account-form.ts';

function strengthHint(score: PasswordScore | undefined): string | undefined {
  return score === undefined
    ? undefined
    : fr.setup.passwordStrength(fr.setup.strengthLevels[score] ?? '');
}

interface SetupAccountStepProps extends SetupAccountFormOptions {
  onBack: () => void;
}

/** The username and password, rated as they are typed; the server checks the setup code on the way. */
export function SetupAccountStep({ onBack, ...options }: SetupAccountStepProps) {
  const form = useSetupAccountForm(options);
  return (
    <AuthStepLayout
      title={fr.setup.accountTitle}
      intro={fr.setup.accountIntro}
      onSubmit={form.submit}
      error={form.formError}
      actions={
        <>
          <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
            {fr.common.continue}
          </Button>
          <Button variant="text" onClick={onBack}>
            {fr.common.back}
          </Button>
        </>
      }
    >
      <TextField
        label={fr.auth.usernameLabel}
        error={form.errors.username}
        value={form.values.username}
        onChange={(event) => form.set.username(event.target.value)}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus
      />
      <NewPasswordFields form={form} />
    </AuthStepLayout>
  );
}

/** The new password, rated as it is typed, then typed again. */
function NewPasswordFields({ form }: { form: SetupAccountForm }) {
  const { score } = form;
  return (
    <>
      <PasswordField
        label={fr.auth.passwordLabel}
        revealLabel={fr.auth.revealPassword}
        hint={strengthHint(score)}
        error={form.errors.password}
        value={form.values.password}
        onChange={(event) => form.set.password(event.target.value)}
        autoComplete="new-password"
      />
      {score !== undefined && (
        <PasswordStrengthBars score={score} strongEnough={score >= MIN_PASSWORD_SCORE} />
      )}
      <PasswordField
        label={fr.setup.confirmLabel}
        revealLabel={fr.auth.revealPassword}
        error={form.errors.confirmation}
        value={form.values.confirmation}
        onChange={(event) => form.set.confirmation(event.target.value)}
        autoComplete="new-password"
      />
    </>
  );
}
