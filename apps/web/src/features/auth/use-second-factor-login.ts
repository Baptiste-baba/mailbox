import { loginRequestSchema } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import type { Credentials } from './credentials.ts';
import { logIn } from './login-requests.ts';
import { useCodeInput } from './use-code-input.ts';
import { useRetryCountdown } from './use-retry-countdown.ts';

type SecondFactorKind = 'totp' | 'recoveryCode';

const messages: Record<SecondFactorKind, { format: string; rejected: string }> = {
  totp: { format: fr.authenticator.codeFormat, rejected: fr.login.codeRejected },
  recoveryCode: { format: fr.login.recoveryFormat, rejected: fr.login.recoveryRejected },
};

export interface SecondFactorLoginOptions {
  credentials: Credentials;
  /** The password changed meanwhile: back to the first step. */
  onCredentialsRefused: () => void;
  /** The access was reset on the server meanwhile: off to setup. */
  onSetupRequired: () => void;
  onSignedIn: () => void;
}

/** Which second factor the user types, what they typed, and why it is refused, if it is. */
function useSecondFactorInput() {
  const [kind, setKind] = useState<SecondFactorKind>('totp');
  const input = useCodeInput();
  return {
    ...input,
    kind,
    switchKind: () => {
      setKind(kind === 'totp' ? 'recoveryCode' : 'totp');
      input.clear();
    },
  };
}

/** The code of the authenticator app, or a recovery code, sent with the password to sign in. */
export function useSecondFactorLogin(options: SecondFactorLoginOptions) {
  const { credentials, onCredentialsRefused, onSetupRequired, onSignedIn } = options;
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
    } else if (error instanceof ApiError && error.code === 'SETUP_REQUIRED') {
      onSetupRequired();
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
    // During a wait, only a passkey can fail: what it says is the latest news.
    error: formError ?? countdown.message,
    /** Shows why another way to sign in failed, in place of the form's own error. */
    showError: setFormError,
    blocked: login.isPending || countdown.waiting,
    submit,
  };
}
