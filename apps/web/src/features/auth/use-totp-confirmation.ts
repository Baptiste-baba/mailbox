import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { isTotpCode } from './totp-code-field.tsx';
import { useCodeInput } from './use-code-input.ts';

interface TotpConfirmationOptions<Result> {
  /** Sends the first code of the new authenticator app, with what it confirms. */
  send: (totpCode: string) => Promise<Result>;
  onConfirmed: (result: Result) => void;
  /** Gives the message to show for any other error, if the screen shows one. */
  onFailure: (error: unknown) => string | undefined;
}

/** The first code of a new authenticator app, proving the app holds the secret, then sent. */
export function useTotpConfirmation<Result>(options: TotpConfirmationOptions<Result>) {
  const { send, onConfirmed, onFailure } = options;
  const input = useCodeInput();
  const [formError, setFormError] = useState<string>();
  const confirmation = useMutation({ mutationFn: send });
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'INVALID_SECOND_FACTOR') {
      input.setCodeError(fr.authenticator.codeRejected);
    } else {
      setFormError(onFailure(error));
    }
  };
  const submit = () => {
    if (!isTotpCode(input.code)) {
      input.setCodeError(fr.authenticator.codeFormat);
      return;
    }
    setFormError(undefined);
    confirmation.mutate(input.code, { onSuccess: onConfirmed, onError });
  };
  return {
    code: input.code,
    changeCode: input.changeCode,
    codeError: input.codeError,
    formError,
    pending: confirmation.isPending,
    submit,
  };
}
