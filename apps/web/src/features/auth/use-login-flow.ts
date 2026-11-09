import type { LoginResponse } from '@mailbox/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { authStatusQuery } from '../../api/auth-status-query.ts';
import { fr } from '../../i18n/fr.ts';
import type { Credentials } from './use-password-login.ts';

export type LoginStep =
  | { name: 'password'; rejection: string | undefined }
  | { name: 'secondFactor' }
  | { name: 'replaceAuthenticator'; recoveryCodesLeft: number };

/** Where the sign-in stands, and how each step hands over to the next. */
export function useLoginFlow(redirect: string | undefined) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>({ name: 'password', rejection: undefined });
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' });
  const enterApp = () => {
    // Asked again on the way in: the server says who signed in, with the username as stored.
    queryClient.removeQueries({ queryKey: authStatusQuery.queryKey });
    void navigate({ href: redirect ?? '/' });
  };
  return {
    step,
    credentials,
    passwordChecked: (checked: Credentials) => {
      setCredentials(checked);
      setStep({ name: 'secondFactor' });
    },
    signedIn: (response: LoginResponse) => {
      if (response.usedRecoveryCode) {
        setStep({ name: 'replaceAuthenticator', recoveryCodesLeft: response.recoveryCodesLeft });
      } else {
        enterApp();
      }
    },
    credentialsRefused: () => setStep({ name: 'password', rejection: fr.login.invalidCredentials }),
    backToPassword: () => setStep({ name: 'password', rejection: undefined }),
    enterApp,
  };
}

export type LoginFlow = ReturnType<typeof useLoginFlow>;
