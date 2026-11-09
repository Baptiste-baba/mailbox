import { Button, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { TotpCodeField } from './totp-code-field.tsx';
import { type SecondFactorLoginOptions, useSecondFactorLogin } from './use-second-factor-login.ts';

interface LoginSecondFactorStepProps extends SecondFactorLoginOptions {
  onBack: () => void;
}

/** The second factor: the code of the authenticator app, or a recovery code without the phone. */
export function LoginSecondFactorStep({ onBack, ...options }: LoginSecondFactorStepProps) {
  const form = useSecondFactorLogin(options);
  const withApp = form.kind === 'totp';
  return (
    <AuthStepLayout
      title={withApp ? fr.login.codeTitle : fr.login.recoveryTitle}
      intro={withApp ? fr.login.codeIntro : fr.login.recoveryIntro}
      onSubmit={form.submit}
      error={form.error}
      actions={
        <>
          <Button variant="primary" size="lg" type="submit" disabled={form.blocked}>
            {fr.login.signIn}
          </Button>
          <Button variant="text" onClick={form.switchKind}>
            {withApp ? fr.login.useRecoveryCode : fr.login.useAuthenticator}
          </Button>
          <Button variant="text" onClick={onBack}>
            {fr.common.back}
          </Button>
        </>
      }
    >
      {withApp ? (
        <TotpCodeField value={form.code} onChange={form.changeCode} error={form.codeError} />
      ) : (
        <TextField
          label={fr.login.recoveryLabel}
          error={form.codeError}
          value={form.code}
          onChange={(event) => form.changeCode(event.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
        />
      )}
    </AuthStepLayout>
  );
}
