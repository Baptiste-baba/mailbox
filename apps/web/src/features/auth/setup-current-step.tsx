import { SetupAccountStep } from './setup-account-step.tsx';
import { SetupAuthenticatorStep } from './setup-authenticator-step.tsx';
import { SetupCodeStep } from './setup-code-step.tsx';
import { SetupRecoveryCodesStep } from './setup-recovery-codes-step.tsx';
import type { SetupFlow } from './use-setup-flow.ts';

/** The step the setup stands at, wired to the flow. */
export function SetupCurrentStep({ flow }: { flow: SetupFlow }) {
  const { step, setupCode, account } = flow;
  const fromServer = { setupCode, onFailure: flow.onFailure };
  switch (step.index) {
    case 0:
      return (
        <SetupCodeStep
          initialCode={setupCode}
          rejection={step.rejection}
          onDone={flow.codeEntered}
        />
      );
    case 1:
      return (
        <SetupAccountStep
          {...fromServer}
          initial={account}
          onBack={flow.backToCode}
          onDone={flow.accountEntered}
        />
      );
    case 2:
      return (
        <SetupAuthenticatorStep
          {...fromServer}
          account={account}
          enrollment={step.enrollment}
          onBack={flow.backToAccount}
          onCreated={flow.accountCreated}
        />
      );
    case 3:
      return (
        <SetupRecoveryCodesStep
          username={account.username}
          recoveryCodes={step.recoveryCodes}
          onEnter={flow.enterApp}
        />
      );
  }
}
