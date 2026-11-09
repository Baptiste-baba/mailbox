import { getRouteApi } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { AuthLayout } from './auth-layout.tsx';

const route = getRouteApi('/login');

export function LoginPage() {
  const { reason } = route.useSearch();
  return (
    <AuthLayout title={fr.auth.loginTitle}>
      {reason === 'expired' && <p className="text-ink2">{fr.auth.sessionExpired}</p>}
    </AuthLayout>
  );
}
