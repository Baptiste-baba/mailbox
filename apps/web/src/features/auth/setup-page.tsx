import { Button } from '@mailbox/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fr } from '../../i18n/fr.ts';
import { AuthLayout } from './auth-layout.tsx';
import { passwordCheckerQuery } from './password-checker.ts';
import { SetupCurrentStep } from './setup-current-step.tsx';
import { SetupProgress } from './setup-progress.tsx';
import { useSetupFlow } from './use-setup-flow.ts';

/** First run: creates the account with the setup code from the server logs, step by step. */
export function SetupPage() {
  const flow = useSetupFlow();
  const queryClient = useQueryClient();
  // Loaded while the user reads the first step: rating the password is instant once there.
  useEffect(() => {
    void queryClient.prefetchQuery(passwordCheckerQuery);
  }, [queryClient]);
  if (flow.unavailable) {
    return (
      <AuthLayout title={fr.auth.setupTitle}>
        <p className="text-ink-2">{fr.setup.alreadyDone}</p>
        <Button variant="primary" size="lg" onClick={flow.signInInstead}>
          {fr.setup.signIn}
        </Button>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title={fr.auth.setupTitle}>
      <SetupProgress current={flow.step.index} />
      <SetupCurrentStep flow={flow} />
    </AuthLayout>
  );
}
