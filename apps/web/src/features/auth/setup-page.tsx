import { fr } from '../../i18n/fr.ts';
import { AuthLayout } from './auth-layout.tsx';

/** First run: creates the account with the setup code from the server logs. */
export function SetupPage() {
  return <AuthLayout title={fr.auth.setupTitle} />;
}
