import type { TotpEnrollment } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { createAccount } from './setup-requests.ts';
import { isTotpCode } from './totp-code-field.tsx';
import type { SetupAccount } from './use-setup-account-form.ts';

export interface CreateAccountOptions {
  setupCode: string;
  account: SetupAccount;
  enrollment: TotpEnrollment;
  /** Handles what concerns the whole setup; gives the message to show here, if any. */
  onFailure: (error: unknown) => string | undefined;
  onCreated: (recoveryCodes: string[]) => void;
}

/** The first code of the authenticator app, and the creation of the account it confirms. */
export function useCreateAccount(options: CreateAccountOptions) {
  const { setupCode, account, enrollment, onFailure, onCreated } = options;
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const creation = useMutation({ mutationFn: createAccount });
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'INVALID_SECOND_FACTOR') {
      setCodeError(fr.authenticator.codeRejected);
    } else {
      setFormError(onFailure(error));
    }
  };
  const submit = () => {
    if (!isTotpCode(code)) {
      setCodeError(fr.authenticator.codeFormat);
      return;
    }
    setFormError(undefined);
    creation.mutate(
      { setupCode, ...account, totpSecret: enrollment.secret, totpCode: code },
      { onSuccess: (result) => onCreated(result.recoveryCodes), onError },
    );
  };
  const changeCode = (typed: string) => {
    setCode(typed);
    setCodeError(undefined);
  };
  return { code, changeCode, codeError, formError, pending: creation.isPending, submit };
}
