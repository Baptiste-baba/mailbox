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
  // The second factor step says what it asks for itself.
  const greeting = reason === 'ended' ? fr.auth.sessionEnded : fr.auth.loginIntro;
  return (
    <AuthLayout
      title={fr.auth.loginTitle}
      intro={flow.step.name === 'password' ? greeting : undefined}
    >
      <LoginCurrentStep flow={flow} />
      <LostAccess />
    </AuthLayout>
  );
}
