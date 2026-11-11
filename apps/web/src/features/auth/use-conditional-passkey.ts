import type { PasskeyAuthenticationResponse } from '@mailbox/shared';
import { useEffect, useEffectEvent, useRef } from 'react';
import { startPasskeyLogin } from './login-requests.ts';
import { getPasskey, passkeysSupported } from './passkey-ceremony.ts';

/** A suggestion is asked for again this often: its challenge lives five minutes on the server. */
export const SUGGESTION_RENEWAL_MS = 4 * 60 * 1_000;

/**
 * Waits for the user to pick a passkey among the suggestions of the username field, asking again
 * before the challenge expires. Undefined once `signal` stops it, or when the browser gives up, as
 * when the user declines to unlock the passkey: the suggestion ends quietly, the button remains,
 * and it tells what goes wrong.
 */
export async function waitForSuggestedPasskey(
  signal: AbortSignal,
): Promise<PasskeyAuthenticationResponse | undefined> {
  while (!signal.aborted) {
    const renewal = new AbortController();
    const renew = () => renewal.abort();
    signal.addEventListener('abort', renew, { once: true });
    const timer = setTimeout(renew, SUGGESTION_RENEWAL_MS);
    try {
      const options = await startPasskeyLogin();
      return await getPasskey(options, { mediation: 'conditional', signal: renewal.signal });
    } catch {
      if (signal.aborted || !renewal.signal.aborted) {
        return undefined;
      }
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', renew);
    }
  }
  return undefined;
}

async function suggestPasskeys(signal: AbortSignal) {
  // Browsers that do not suggest passkeys in fields keep them for the button.
  const available = await PublicKeyCredential.isConditionalMediationAvailable();
  return available ? waitForSuggestedPasskey(signal) : undefined;
}

interface Suggestion {
  controller: AbortController;
  /** Settles once the browser has let go of the request. */
  settled: Promise<void>;
}

/**
 * Offers the app's passkeys among the browser's suggestions for the username field while
 * `enabled`: picking one hands it over at once, signed.
 */
export function useConditionalPasskey(
  enabled: boolean,
  onPicked: (response: PasskeyAuthenticationResponse) => void,
) {
  const current = useRef<Suggestion>(undefined);
  const picked = useEffectEvent(onPicked);
  useEffect(() => {
    if (!enabled || !passkeysSupported()) {
      return;
    }
    const controller = new AbortController();
    const settled = suggestPasskeys(controller.signal).then((response) => {
      if (response !== undefined) {
        picked(response);
      }
    });
    current.current = { controller, settled };
    return () => controller.abort();
  }, [enabled]);
  return {
    /** Stops suggesting, once the browser has let go: it takes one passkey request at a time. */
    stop: async () => {
      current.current?.controller.abort();
      await current.current?.settled;
    },
  };
}
