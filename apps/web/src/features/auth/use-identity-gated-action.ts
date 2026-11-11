import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '../../api/api-error.ts';

interface IdentityGatedActionOptions<Variables> {
  mutationFn: (variables: Variables) => Promise<unknown>;
  onSuccess: () => unknown;
  /** What to tell the user after the action failed, if anything. */
  errorMessage: (failure: unknown) => string | undefined;
}

function asksForConfirmation(failure: unknown): boolean {
  return failure instanceof ApiError && failure.code === 'IDENTITY_CONFIRMATION_REQUIRED';
}

/**
 * An action the api may hold back for want of a recent identity confirmation: the confirmation
 * shows in its place while `confirming`, and the action runs again once the user has confirmed.
 */
export function useIdentityGatedAction<Variables = void>({
  mutationFn,
  onSuccess,
  errorMessage,
}: IdentityGatedActionOptions<Variables>) {
  const [held, setHeld] = useState<{ variables: Variables }>();
  const action = useMutation({
    mutationFn,
    // Given here rather than to mutate(): they run even when the dialog was closed meanwhile.
    onSuccess,
    onError: (failure, variables) => {
      if (asksForConfirmation(failure)) {
        setHeld({ variables });
      }
    },
  });
  const failure = action.error;
  return {
    confirming: held !== undefined,
    confirmed: () => {
      setHeld(undefined);
      if (held !== undefined) {
        action.mutate(held.variables);
      }
    },
    error: failure === null || asksForConfirmation(failure) ? undefined : errorMessage(failure),
    pending: action.isPending,
    run: (variables: Variables) => action.mutate(variables),
  };
}
