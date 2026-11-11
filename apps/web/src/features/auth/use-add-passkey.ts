import { passkeyRegistrationSchema } from '@mailbox/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { passkeysQuery } from '../../api/passkeys-query.ts';
import { fr } from '../../i18n/fr.ts';
import { createPasskey } from './passkey-ceremony.ts';
import { passkeyCreationErrorMessage } from './passkey-error-message.ts';
import { addPasskey, startPasskeyCreation } from './passkey-requests.ts';
import { useIdentityGate } from './use-identity-gate.ts';

/** The api's options, then the password manager's new passkey, kept by the api under `name`. */
async function createAndAddPasskey(name: string): Promise<void> {
  const options = await startPasskeyCreation();
  await addPasskey({ name, response: await createPasskey(options) });
}

/**
 * Adding a passkey under a name: the identity is confirmed first when the api asks, then the
 * browser asks where to keep the passkey, and the list shows it once added.
 */
export function useAddPasskey(onAdded: () => void) {
  const queryClient = useQueryClient();
  const gate = useIdentityGate();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [error, setError] = useState<string>();
  const add = useMutation({ mutationFn: createAndAddPasskey });
  const run = (checkedName: string) => {
    setError(undefined);
    add.mutate(checkedName, {
      onSuccess: async () => {
        await queryClient.invalidateQueries(passkeysQuery);
        onAdded();
      },
      onError: (failure) => {
        if (!gate.holds(failure, () => run(checkedName))) {
          setError(passkeyCreationErrorMessage(failure));
        }
      },
    });
  };
  return {
    gate,
    name,
    nameError,
    error,
    pending: add.isPending,
    changeName: (typed: string) => {
      setName(typed);
      setNameError(undefined);
    },
    submit: () => {
      const checked = passkeyRegistrationSchema.shape.name.safeParse(name);
      if (checked.success) {
        run(checked.data);
      } else {
        setNameError(fr.passkey.nameMissing);
      }
    },
  };
}
