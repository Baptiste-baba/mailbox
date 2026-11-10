import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import type { Credentials } from './credentials.ts';
import { useContinueTo } from './use-continue-to.ts';

type LoginStep = { name: 'password'; rejection: string | undefined } | { name: 'secondFactor' };

/** Where the sign-in stands, and how each step hands over to the next. */
export function useLoginFlow(redirect: string | undefined) {
  const continueTo = useContinueTo();
  const [step, setStep] = useState<LoginStep>({ name: 'password', rejection: undefined });
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  return {
    step,
    credentials,
    passwordChecked: (checked: Credentials) => {
      setCredentials(checked);
      setStep({ name: 'secondFactor' });
    },
    // Where the session may go now is the status's to say: the app, or the new authenticator app
    // after a recovery code.
    signedIn: () => continueTo(redirect ?? '/'),
    credentialsRefused: () => setStep({ name: 'password', rejection: fr.login.invalidCredentials }),
    /** No account any more, after a reset on the server: off to setup. */
    setupRequired: () => continueTo('/setup'),
    backToPassword: () => setStep({ name: 'password', rejection: undefined }),
  };
}

export type LoginFlow = ReturnType<typeof useLoginFlow>;
