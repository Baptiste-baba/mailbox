import type { TotpEnrollment } from '@mailbox/shared';
import { Button, StateMessage } from '@mailbox/ui';
import { getRouteApi } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { AuthLayout } from './auth-layout.tsx';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { AuthenticatorEnrollment } from './authenticator-enrollment.tsx';
import { replaceAuthenticator } from './login-requests.ts';
import { TotpCodeField } from './totp-code-field.tsx';
import { useNewAuthenticatorSecret } from './use-authenticator-replacement.ts';
import { useContinueTo } from './use-continue-to.ts';
import { useTotpConfirmation } from './use-totp-confirmation.ts';

const route = getRouteApi('/new-authenticator');

/**
 * After a recovery code, the authenticator app is presumed lost: the server opens nothing else to
 * this session until a new app is set up here. Back to the page asked for at the end.
 */
export function ReplaceAuthenticatorPage() {
  const { recoveryCodesLeft } = route.useRouteContext();
  const { redirect } = route.useSearch();
  const continueTo = useContinueTo();
  const secret = useNewAuthenticatorSecret();
  return (
    <AuthLayout
      title={fr.login.replaceTitle}
      wide
      intro={`${fr.login.replaceIntro} ${fr.login.recoveryCodesLeft(recoveryCodesLeft)}`}
    >
      {secret.enrollment === undefined ? (
        <StateMessage
          message={
            secret.loadError === undefined
              ? fr.loading
              : `${fr.login.replaceLoadError} ${secret.loadError}`
          }
          action={
            secret.loadError === undefined
              ? undefined
              : { label: fr.common.retry, onClick: secret.reload }
          }
        />
      ) : (
        <NewAuthenticatorForm
          enrollment={secret.enrollment}
          onDone={() => continueTo(redirect ?? '/')}
        />
      )}
    </AuthLayout>
  );
}

interface NewAuthenticatorFormProps {
  enrollment: TotpEnrollment;
  onDone: () => void;
}

function NewAuthenticatorForm({ enrollment, onDone }: NewAuthenticatorFormProps) {
  const form = useTotpConfirmation({
    send: (totpCode) => replaceAuthenticator({ totpSecret: enrollment.secret, totpCode }),
    onConfirmed: onDone,
    onFailure: (error) => authErrorMessage(error),
  });
  return (
    <AuthStepLayout
      onSubmit={form.submit}
      error={form.formError}
      actions={
        <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
          {fr.login.replaceDone}
        </Button>
      }
    >
      <AuthenticatorEnrollment enrollment={enrollment}>
        <TotpCodeField value={form.code} onChange={form.changeCode} error={form.codeError} />
      </AuthenticatorEnrollment>
    </AuthStepLayout>
  );
}
