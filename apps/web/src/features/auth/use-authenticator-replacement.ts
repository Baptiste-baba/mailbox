import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';
import { authErrorMessage } from './auth-error-message.ts';
import { replaceAuthenticator, startAuthenticatorReplacement } from './login-requests.ts';
import { isTotpCode } from './totp-code-field.tsx';

// Right after signing in, the only cause of a refused session is a cookie the browser did not keep.
const expectedErrors = { UNAUTHENTICATED: fr.login.sessionNotKept };

/** A new secret for the authenticator app, asked once when the screen opens. */
function useNewSecret() {
  const enrollment = useQuery({
    queryKey: ['auth', 'authenticator-replacement'],
    queryFn: startAuthenticatorReplacement,
    staleTime: Number.POSITIVE_INFINITY,
    // A secret is never offered twice: leaving the screen forgets it.
    gcTime: 0,
  });
  return {
    enrollment: enrollment.data,
    loadError: enrollment.isError ? authErrorMessage(enrollment.error, expectedErrors) : undefined,
    reload: () => enrollment.refetch(),
  };
}

/** A new secret for the authenticator app, and the code that proves the new app holds it. */
export function useAuthenticatorReplacement(onDone: () => void) {
  const secret = useNewSecret();
  const { enrollment } = secret;
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const replacement = useMutation({ mutationFn: replaceAuthenticator });
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.code === 'INVALID_SECOND_FACTOR') {
      setCodeError(fr.authenticator.codeRejected);
    } else {
      setFormError(authErrorMessage(error, expectedErrors));
    }
  };
  const submit = () => {
    if (enrollment === undefined) {
      return;
    }
    if (!isTotpCode(code)) {
      setCodeError(fr.authenticator.codeFormat);
      return;
    }
    setFormError(undefined);
    replacement.mutate(
      { totpSecret: enrollment.secret, totpCode: code },
      { onSuccess: onDone, onError },
    );
  };
  return {
    ...secret,
    code,
    changeCode: (typed: string) => {
      setCode(typed);
      setCodeError(undefined);
    },
    codeError,
    formError,
    pending: replacement.isPending,
    submit,
  };
}
