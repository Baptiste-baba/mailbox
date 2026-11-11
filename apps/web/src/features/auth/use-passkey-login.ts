import type { PasskeyAuthenticationResponse } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { logInWithPasskey, startPasskeyLogin } from './login-requests.ts';
import { getPasskey, passkeysSupported } from './passkey-ceremony.ts';
import { passkeyErrorMessage } from './passkey-error-message.ts';
import { useConditionalPasskey } from './use-conditional-passkey.ts';

/** Signs in with the passkey picked among the suggestions, or else asks the browser for one. */
async function signInWithPasskey(picked: PasskeyAuthenticationResponse | undefined) {
  const response = picked ?? (await getPasskey(await startPasskeyLogin()));
  await logInWithPasskey({ response });
}

/**
 * Signing in with a passkey alone: from a button, where the browser asks which one and to unlock
 * it, and, with `suggest`, from the suggestions of the username field.
 */
export function usePasskeyLogin(onSignedIn: () => void, { suggest = false } = {}) {
  const [error, setError] = useState<string>();
  const [signingIn, setSigningIn] = useState(false);
  const login = useMutation({ mutationFn: signInWithPasskey });
  const signIn = (picked?: PasskeyAuthenticationResponse) => {
    setError(undefined);
    setSigningIn(true);
    login.mutate(picked, {
      onSuccess: onSignedIn,
      onError: (failure) => {
        setError(passkeyErrorMessage(failure));
        // The suggestions come back, for another try.
        setSigningIn(false);
      },
    });
  };
  const suggestion = useConditionalPasskey(suggest && !signingIn, signIn);
  return {
    /** False where the browser cannot use passkeys: nothing offers them there. */
    supported: passkeysSupported(),
    pending: login.isPending,
    error,
    /** The form is sent: a former passkey failure no longer applies. */
    clearError: () => setError(undefined),
    start: async () => {
      await suggestion.stop();
      signIn();
    },
  };
}
