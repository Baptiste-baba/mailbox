import type { IdentityConfirmation } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { getPasskey } from './passkey-ceremony.ts';
import { passkeyErrorMessage } from './passkey-error-message.ts';
import { confirmIdentity, startIdentityConfirmation } from './passkey-requests.ts';
import { isTotpCode } from './totp-code-field.tsx';
import { useCodeInput } from './use-code-input.ts';
import { useRetryCountdown } from './use-retry-countdown.ts';

/** A passkey of the account, or the password and a code of the app. */
type Proof = 'passkey' | Extract<IdentityConfirmation, { method: 'password' }>;

async function sendProof(proof: Proof): Promise<void> {
  if (proof !== 'passkey') {
    return confirmIdentity(proof);
  }
  const options = await startIdentityConfirmation();
  await confirmIdentity({ method: 'passkey', response: await getPasskey(options) });
}

function errorMessage(failure: unknown): string | undefined {
  return failure instanceof DOMException
    ? passkeyErrorMessage(failure)
    : authErrorMessage(failure, {
        INVALID_CREDENTIALS: fr.identity.wrongPassword,
        INVALID_PASSKEY: fr.passkey.rejected,
      });
}

/** Proving again who one is: with a passkey, or the password and a code of the app. */
export function useIdentityConfirmation(onConfirmed: () => void) {
  const [password, setPassword] = useState('');
  const code = useCodeInput();
  const [error, setError] = useState<string>();
  const countdown = useRetryCountdown();
  const confirm = useMutation({ mutationFn: sendProof });
  const send = (proof: Proof) => {
    setError(undefined);
    confirm.mutate(proof, {
      onSuccess: onConfirmed,
      onError: (failure) => {
        if (failure instanceof ApiError && failure.code === 'INVALID_SECOND_FACTOR') {
          code.setCodeError(fr.login.codeRejected);
        } else if (!countdown.startFrom(failure)) {
          setError(errorMessage(failure));
        }
      },
    });
  };
  return {
    password,
    setPassword,
    code,
    error: countdown.message ?? error,
    blocked: confirm.isPending || countdown.waiting,
    withPasskey: () => send('passkey'),
    submit: () => {
      if (password === '') {
        setError(fr.identity.passwordMissing);
      } else if (!isTotpCode(code.code)) {
        code.setCodeError(fr.authenticator.codeFormat);
      } else {
        send({ method: 'password', password, totpCode: code.code });
      }
    },
  };
}
