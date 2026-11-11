import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { logInWithPasskey, startPasskeyLogin } from './login-requests.ts';
import { getPasskey, passkeysSupported } from './passkey-ceremony.ts';
import { passkeyErrorMessage } from './passkey-error-message.ts';

async function signInWithPasskey(): Promise<void> {
  const options = await startPasskeyLogin();
  await logInWithPasskey({ response: await getPasskey(options) });
}

/** Signing in with a passkey alone, from a button: the browser asks which one, then to unlock it. */
export function usePasskeyLogin(onSignedIn: () => void) {
  const [error, setError] = useState<string>();
  const login = useMutation({ mutationFn: signInWithPasskey });
  return {
    /** False where the browser cannot use passkeys: nothing offers them there. */
    supported: passkeysSupported(),
    pending: login.isPending,
    error,
    start: () => {
      setError(undefined);
      login.mutate(undefined, {
        onSuccess: onSignedIn,
        onError: (failure) => setError(passkeyErrorMessage(failure)),
      });
    },
  };
}
