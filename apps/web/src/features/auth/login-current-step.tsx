import { LoginPasswordStep } from './login-password-step.tsx';
import { LoginSecondFactorStep } from './login-second-factor-step.tsx';
import type { LoginFlow } from './use-login-flow.ts';

/** The step the sign-in stands at, wired to the flow. */
export function LoginCurrentStep({ flow }: { flow: LoginFlow }) {
  const { step } = flow;
  switch (step.name) {
    case 'password':
      return (
        <LoginPasswordStep
          initial={flow.credentials}
          rejection={step.rejection}
          onDone={flow.passwordChecked}
          onSetupRequired={flow.setupRequired}
        />
      );
    case 'secondFactor':
      return (
        <LoginSecondFactorStep
          credentials={flow.credentials}
          onBack={flow.backToPassword}
          onCredentialsRefused={flow.credentialsRefused}
          onSetupRequired={flow.setupRequired}
          onSignedIn={flow.signedIn}
        />
      );
  }
}
