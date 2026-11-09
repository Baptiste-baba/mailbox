import { Button, StateMessage } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { AuthenticatorEnrollment } from './authenticator-enrollment.tsx';
import { TotpCodeField } from './totp-code-field.tsx';
import { useAuthenticatorReplacement } from './use-authenticator-replacement.ts';

interface LoginReplaceAuthenticatorStepProps {
  recoveryCodesLeft: number;
  onDone: () => void;
}

/**
 * After a recovery code, the authenticator app is presumed lost: a new one is set up before the
 * app opens, with no way around it.
 */
export function LoginReplaceAuthenticatorStep({
  recoveryCodesLeft,
  onDone,
}: LoginReplaceAuthenticatorStepProps) {
  const form = useAuthenticatorReplacement(onDone);
  if (form.enrollment === undefined) {
    return form.loadError === undefined ? (
      <p role="status" className="text-ink3">
        {fr.loading}
      </p>
    ) : (
      <StateMessage
        message={`${fr.login.replaceLoadError} ${form.loadError}`}
        action={{ label: fr.common.retry, onClick: form.reload }}
      />
    );
  }
  return (
    <AuthStepLayout
      title={fr.login.replaceTitle}
      intro={`${fr.login.replaceIntro} ${fr.login.recoveryCodesLeft(recoveryCodesLeft)}`}
      onSubmit={form.submit}
      error={form.formError}
      actions={
        <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
          {fr.login.replaceDone}
        </Button>
      }
    >
      <AuthenticatorEnrollment enrollment={form.enrollment} />
      <TotpCodeField value={form.code} onChange={form.changeCode} error={form.codeError} />
    </AuthStepLayout>
  );
}
