import type { PasskeyAuthenticationResponse } from '@mailbox/shared';
import { useMutation } from '@tanstack/react-query';
import { logInWithPasskey, startPasskeyLogin } from './login-requests.ts';
import { getPasskey, passkeysSupported } from './passkey-ceremony.ts';
import { passkeyErrorMessage } from './passkey-error-message.ts';
import { useConditionalPasskey } from './use-conditional-passkey.ts';

/** Signs in with the passkey picked among the suggestions, or else asks the browser for one. */
async function signInWithPasskey(picked: PasskeyAuthenticationResponse | undefined) {
  const response = picked ?? (await getPasskey(await startPasskeyLogin()));
  await logInWithPasskey({ response });
}

interface PasskeyLoginOptions {
  /** Offers the passkeys among the suggestions of the username field too. */
  suggest?: boolean;
  /** Says why the passkey did not sign in, in the step's error; undefined when nothing needs saying. */
  onError: (message: string | undefined) => void;
}

/**
 * Signing in with a passkey alone: from a button, where the browser asks which one and to unlock
 * it, and, with `suggest`, from the suggestions of the username field.
 */
export function usePasskeyLogin(
  onSignedIn: () => void,
  { suggest = false, onError }: PasskeyLoginOptions,
) {
  const login = useMutation({
    mutationFn: signInWithPasskey,
    onSuccess: onSignedIn,
    onError: (failure) => onError(passkeyErrorMessage(failure)),
  });
  // No suggestion while signing in; after a failure, they come back for another try.
  const signingIn = login.isPending || login.isSuccess;
  const suggestion = useConditionalPasskey(suggest && !signingIn, (picked) => login.mutate(picked));
  return {
    /** False where the browser cannot use passkeys: nothing offers them there. */
    supported: passkeysSupported(),
    pending: login.isPending,
    start: async () => {
      await suggestion.stop();
      login.mutate(undefined);
    },
  };
}
