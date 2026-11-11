import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import type { Credentials } from './credentials.ts';
import { logIn } from './login-requests.ts';
import { useRetryCountdown } from './use-retry-countdown.ts';

export interface PasswordLoginOptions {
  initial: Credentials;
  /** Why the credentials typed before were refused, if they were. */
  rejection: string | undefined;
  onDone: (credentials: Credentials) => void;
  onSetupRequired: () => void;
}

/** The username and password, checked by the server before it asks for the second factor. */
export function usePasswordLogin(options: PasswordLoginOptions) {
  const { initial, rejection, onDone, onSetupRequired } = options;
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState(initial.password);
  const [formError, setFormError] = useState(rejection);
  const countdown = useRetryCountdown();
  const login = useMutation({ mutationFn: logIn });
  const onError = (error: unknown) => {
    // The expected answer: the password is right, the second factor comes next.
    if (error instanceof ApiError && error.code === 'SECOND_FACTOR_REQUIRED') {
      onDone({ username: username.trim(), password });
    } else if (error instanceof ApiError && error.code === 'SETUP_REQUIRED') {
      onSetupRequired();
    } else if (!countdown.startFrom(error)) {
      setFormError(
        authErrorMessage(error, {
          INVALID_CREDENTIALS: fr.login.invalidCredentials,
          VALIDATION_FAILED: fr.login.invalidCredentials,
        }),
      );
    }
  };
  const submit = () => {
    if (username.trim() === '' || password === '') {
      setFormError(fr.login.missingCredentials);
      return;
    }
    setFormError(undefined);
    login.mutate({ username: username.trim(), password }, { onError });
  };
  return {
    values: { username, password },
    set: { username: setUsername, password: setPassword },
    // During a wait, only a passkey can fail: what it says is the latest news.
    error: formError ?? countdown.message,
    /** Shows why another way to sign in failed, in place of the form's own error. */
    showError: setFormError,
    blocked: login.isPending || countdown.waiting,
    submit,
  };
}
