import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';

/**
 * Holds back an action the api refused for want of a recent identity confirmation: the
 * confirmation shows in its place, and the action runs again once the user has confirmed.
 */
export function useIdentityGate() {
  const [held, setHeld] = useState<{ retry: () => void }>();
  return {
    confirming: held !== undefined,
    /** Whether `error` asks for a confirmation; the action then waits for it, to `retry`. */
    holds: (error: unknown, retry: () => void): boolean => {
      const asked = error instanceof ApiError && error.code === 'IDENTITY_CONFIRMATION_REQUIRED';
      if (asked) {
        setHeld({ retry });
      }
      return asked;
    },
    confirmed: () => {
      setHeld(undefined);
      held?.retry();
    },
  };
}
