import type { TotpEnrollment } from '@mailbox/shared';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import type { Credentials } from './credentials.ts';
import { useContinueTo } from './use-continue-to.ts';

export type SetupStep =
  | { index: 0; rejection: string | undefined }
  | { index: 1 }
  | { index: 2; enrollment: TotpEnrollment }
  | { index: 3; recoveryCodes: string[] };

interface FailureHandlers {
  rejectCode: () => void;
  markUnavailable: () => void;
}

/**
 * Handles what concerns the whole setup, whichever step the server answers: a refused setup code
 * sends back to the first step, an account created meanwhile ends the setup. Gives the message
 * the step shows for anything else.
 */
function handleSetupFailure(error: unknown, handlers: FailureHandlers): string | undefined {
  if (error instanceof ApiError && error.code === 'INVALID_SETUP_CODE') {
    handlers.rejectCode();
    return undefined;
  }
  if (error instanceof ApiError && error.code === 'SETUP_NOT_AVAILABLE') {
    handlers.markUnavailable();
    return undefined;
  }
  return authErrorMessage(error);
}

/** Where the setup stands, what was typed so far, and how each step hands over to the next. */
export function useSetupFlow() {
  const continueTo = useContinueTo();
  const [step, setStep] = useState<SetupStep>({ index: 0, rejection: undefined });
  const [setupCode, setSetupCode] = useState('');
  const [account, setAccount] = useState<Credentials>({ username: '', password: '' });
  const [unavailable, setUnavailable] = useState(false);
  return {
    step,
    setupCode,
    account,
    unavailable,
    onFailure: (error: unknown) =>
      handleSetupFailure(error, {
        rejectCode: () => setStep({ index: 0, rejection: fr.setup.codeRejected }),
        markUnavailable: () => setUnavailable(true),
      }),
    codeEntered: (code: string) => {
      setSetupCode(code);
      setStep({ index: 1 });
    },
    accountEntered: (entered: Credentials, enrollment: TotpEnrollment) => {
      setAccount(entered);
      setStep({ index: 2, enrollment });
    },
    accountCreated: (recoveryCodes: string[]) => setStep({ index: 3, recoveryCodes }),
    backToCode: () => setStep({ index: 0, rejection: undefined }),
    backToAccount: () => setStep({ index: 1 }),
    // Signed in by the setup, or not if the account was created elsewhere: the app or sign-in.
    enterApp: () => continueTo('/'),
    signInInstead: () => continueTo('/'),
  };
}

export type SetupFlow = ReturnType<typeof useSetupFlow>;
