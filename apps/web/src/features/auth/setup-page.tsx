import { Button, Stepper } from '@mailbox/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fr } from '../../i18n/fr.ts';
import { AuthLayout } from './auth-layout.tsx';
import { passwordCheckerQuery } from './password-checker.ts';
import { SetupCurrentStep } from './setup-current-step.tsx';
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
      <AuthLayout title={fr.auth.setupTitle} intro={fr.setup.alreadyDone}>
        <Button variant="primary" size="lg" onClick={flow.signInInstead}>
          {fr.setup.signIn}
        </Button>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      title={fr.auth.setupTitle}
      // The authenticator app and the recovery codes are laid out in two columns.
      wide={flow.step.index >= 2}
      progress={
        <Stepper label={fr.setup.progressLabel} steps={fr.setup.steps} current={flow.step.index} />
      }
    >
      <SetupCurrentStep flow={flow} />
    </AuthLayout>
  );
}
