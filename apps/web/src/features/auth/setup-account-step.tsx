import { Button, PasswordField, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { PasswordRequirements } from './password-requirements.tsx';
import {
  type SetupAccountForm,
  type SetupAccountFormOptions,
  useSetupAccountForm,
} from './use-setup-account-form.ts';

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
        placeholder={fr.auth.usernamePlaceholder}
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
  return (
    <>
      <div className="flex flex-col gap-2">
        <PasswordField
          label={fr.auth.passwordLabel}
          placeholder={fr.setup.newPasswordPlaceholder}
          revealLabel={fr.auth.revealPassword}
          error={form.errors.password}
          value={form.values.password}
          onChange={(event) => form.set.password(event.target.value)}
          autoComplete="new-password"
        />
        <PasswordRequirements password={form.values.password} score={form.score} />
      </div>
      <PasswordField
        label={fr.setup.confirmLabel}
        placeholder={fr.setup.confirmPlaceholder}
        revealLabel={fr.auth.revealPassword}
        error={form.errors.confirmation}
        value={form.values.confirmation}
        onChange={(event) => form.set.confirmation(event.target.value)}
        autoComplete="new-password"
      />
    </>
  );
}
