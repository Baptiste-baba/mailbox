import { MIN_PASSWORD_LENGTH, setupRequestSchema, type TotpEnrollment } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import type { Credentials } from './credentials.ts';
import { MAX_PASSWORD_SCORE, type PasswordScore } from './password-checker.ts';
import { startEnrollment } from './setup-requests.ts';
import { usePasswordScore } from './use-password-score.ts';

/** "Excellente" only: hard to guess even from a stolen copy of the database. */
const MIN_PASSWORD_SCORE = MAX_PASSWORD_SCORE;

/** Long enough for the server, which refuses shorter ones. */
export function isLongEnough(password: string): boolean {
  return setupRequestSchema.shape.password.safeParse(password).success;
}

/** Hard enough to guess; unknown while the dictionaries load. */
export function isStrongEnough(score: PasswordScore | undefined): boolean {
  return score !== undefined && score >= MIN_PASSWORD_SCORE;
}

interface AccountErrors {
  username?: string;
  password?: string;
  confirmation?: string;
}

function accountErrors(
  account: Credentials,
  confirmation: string,
  score: PasswordScore | undefined,
): AccountErrors {
  const errors: AccountErrors = {};
  if (!setupRequestSchema.shape.username.safeParse(account.username).success) {
    errors.username = fr.setup.usernameRequired;
  }
  if (!isLongEnough(account.password)) {
    errors.password = fr.setup.passwordTooShort(MIN_PASSWORD_LENGTH);
  } else if (score !== undefined && !isStrongEnough(score)) {
    errors.password = fr.setup.passwordTooWeak;
  }
  if (confirmation !== account.password) {
    errors.confirmation = fr.setup.confirmMismatch;
  }
  return errors;
}

export interface SetupAccountFormOptions {
  setupCode: string;
  initial: Credentials;
  /** Handles what concerns the whole setup; gives the message to show here, if any. */
  onFailure: (error: unknown) => string | undefined;
  onDone: (account: Credentials, enrollment: TotpEnrollment) => void;
}

/** The values of the account step, their errors, and its submission to the server. */
export function useSetupAccountForm({
  setupCode,
  initial,
  onFailure,
  onDone,
}: SetupAccountFormOptions) {
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState(initial.password);
  const [confirmation, setConfirmation] = useState(initial.password);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [formError, setFormError] = useState<string>();
  const score = usePasswordScore(password, username);
  const enrollment = useMutation({ mutationFn: startEnrollment });
  const submit = () => {
    const account = { username: username.trim(), password };
    const found = accountErrors(account, confirmation, score);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    setFormError(undefined);
    enrollment.mutate(
      { setupCode, username: account.username },
      {
        onSuccess: (result) => onDone(account, result),
        onError: (error) => setFormError(onFailure(error)),
      },
    );
  };
  return {
    values: { username, password, confirmation },
    set: { username: setUsername, password: setPassword, confirmation: setConfirmation },
    errors,
    formError,
    score,
    pending: enrollment.isPending,
    submit,
  };
}

export type SetupAccountForm = ReturnType<typeof useSetupAccountForm>;
