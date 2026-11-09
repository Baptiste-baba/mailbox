import { getRouteApi } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { AuthLayout } from './auth-layout.tsx';
import { LoginCurrentStep } from './login-current-step.tsx';
import { LostAccess } from './lost-access.tsx';
import { useLoginFlow } from './use-login-flow.ts';

const route = getRouteApi('/login');

/** Sign-in: the password, then the second factor; back to the page asked for at the end. */
export function LoginPage() {
  const { redirect, reason } = route.useSearch();
  const flow = useLoginFlow(redirect);
  const { name } = flow.step;
  return (
    <AuthLayout title={fr.auth.loginTitle}>
      {reason === 'expired' && name === 'password' && (
        <p className="text-ink2">{fr.auth.sessionExpired}</p>
      )}
      <LoginCurrentStep flow={flow} />
      {name !== 'replaceAuthenticator' && <LostAccess />}
    </AuthLayout>
  );
}
