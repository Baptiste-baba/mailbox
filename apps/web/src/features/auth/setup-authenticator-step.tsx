import { Button } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { AuthenticatorEnrollment } from './authenticator-enrollment.tsx';
import { TotpCodeField } from './totp-code-field.tsx';
import { type CreateAccountOptions, useCreateAccount } from './use-create-account.ts';

interface SetupAuthenticatorStepProps extends CreateAccountOptions {
  onBack: () => void;
}

/** The authenticator app takes the secret, and proves it with its first code: the account is created. */
export function SetupAuthenticatorStep({ onBack, ...options }: SetupAuthenticatorStepProps) {
  const form = useCreateAccount(options);
  return (
    <AuthStepLayout
      title={fr.setup.authenticatorTitle}
      intro={fr.setup.authenticatorIntro}
      onSubmit={form.submit}
      error={form.formError}
      actions={
        <>
          <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
            {fr.setup.createAccount}
          </Button>
          <Button variant="text" onClick={onBack}>
            {fr.common.back}
          </Button>
        </>
      }
    >
      <AuthenticatorEnrollment enrollment={options.enrollment} />
      <TotpCodeField value={form.code} onChange={form.changeCode} error={form.codeError} />
    </AuthStepLayout>
  );
}
