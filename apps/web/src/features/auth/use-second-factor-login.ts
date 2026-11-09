import { type LoginResponse, loginRequestSchema } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { logIn } from './login-requests.ts';
import type { Credentials } from './use-password-login.ts';
import { useRetryCountdown } from './use-retry-countdown.ts';

export type SecondFactorKind = 'totp' | 'recoveryCode';

const messages: Record<SecondFactorKind, { format: string; rejected: string }> = {
  totp: { format: fr.authenticator.codeFormat, rejected: fr.login.codeRejected },
  recoveryCode: { format: fr.login.recoveryFormat, rejected: fr.login.recoveryRejected },
};

export interface SecondFactorLoginOptions {
  credentials: Credentials;
  /** The password changed meanwhile: back to the first step. */
  onCredentialsRefused: () => void;
  onSignedIn: (response: LoginResponse) => void;
}

/** Which second factor the user types, what they typed, and why it is refused, if it is. */
function useSecondFactorInput() {
  const [kind, setKind] = useState<SecondFactorKind>('totp');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  return {
    kind,
    code,
    codeError,
    setCodeError,
    changeCode: (typed: string) => {
      setCode(typed);
      setCodeError(undefined);
    },
    switchKind: () => {
      setKind(kind === 'totp' ? 'recoveryCode' : 'totp');
      setCode('');
      setCodeError(undefined);
    },
  };
}

/** The code of the authenticator app, or a recovery code, sent with the password to sign in. */
export function useSecondFactorLogin(options: SecondFactorLoginOptions) {
  const { credentials, onCredentialsRefused, onSignedIn } = options;
  const input = useSecondFactorInput();
  const { kind, code, setCodeError } = input;
  const [formError, setFormError] = useState<string>();
  const countdown = useRetryCountdown();
  const login = useMutation({ mutationFn: logIn });
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'INVALID_SECOND_FACTOR') {
      setCodeError(messages[kind].rejected);
    } else if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') {
      onCredentialsRefused();
    } else if (!countdown.startFrom(error)) {
      setFormError(authErrorMessage(error));
    }
  };
  const submit = () => {
    const secondFactor = loginRequestSchema.shape.secondFactor.safeParse({ kind, code }).data;
    if (secondFactor === undefined) {
      setCodeError(messages[kind].format);
      return;
    }
    setFormError(undefined);
    login.mutate({ ...credentials, secondFactor }, { onSuccess: onSignedIn, onError });
  };
  return {
    ...input,
    error: countdown.message ?? formError,
    blocked: login.isPending || countdown.waiting,
    submit,
  };
}
