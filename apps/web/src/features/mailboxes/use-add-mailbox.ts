import {
  type MailboxConnectionRequest,
  mailboxConnectionRequestSchema,
  type PaletteColor,
} from '@mailbox/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiErrorMessage } from '../../api/api-error-message.ts';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { fr } from '../../i18n/fr.ts';
import { useIdentityGatedAction } from '../auth/index.ts';
import { firstFreeColor } from './mailbox-colors.ts';
import { startMailboxConnection } from './mailbox-requests.ts';

/** Asks the api where to sign in at the provider, and takes the browser there. */
async function leaveForProvider(request: MailboxConnectionRequest): Promise<void> {
  const { authorizationUrl } = await startMailboxConnection(request);
  window.location.assign(authorizationUrl);
}

/**
 * Adding a Gmail mailbox under a name and a colour: the identity is confirmed first when the api
 * asks, then the browser leaves for Google, which brings the user back once they signed in.
 */
export function useAddMailbox() {
  const mailboxes = useQuery(mailboxesQuery);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [chosenColor, setChosenColor] = useState<PaletteColor>();
  const [leaving, setLeaving] = useState(false);
  const start = useIdentityGatedAction({
    mutationFn: leaveForProvider,
    // The page is on its way out: the form stays as it is until Google shows.
    onSuccess: () => setLeaving(true),
    errorMessage: (failure) =>
      apiErrorMessage(failure, { MAIL_PROVIDER_NOT_CONFIGURED: fr.mailboxes.notConfigured }),
  });
  const color = chosenColor ?? firstFreeColor(mailboxes.data?.mailboxes ?? []);
  return {
    ...start,
    pending: start.pending || leaving,
    name,
    nameError,
    color,
    changeName: (typed: string) => {
      setName(typed);
      setNameError(undefined);
    },
    changeColor: setChosenColor,
    submit: () => {
      const checked = mailboxConnectionRequestSchema.safeParse({ provider: 'gmail', name, color });
      if (checked.success) {
        start.run(checked.data);
      } else {
        setNameError(fr.mailboxes.nameMissing);
      }
    },
  };
}
