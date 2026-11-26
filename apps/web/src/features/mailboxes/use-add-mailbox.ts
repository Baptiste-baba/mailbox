import { mailboxConnectionRequestSchema, type PaletteColor } from '@mailbox/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { mailboxesQuery } from '../../api/mailboxes-query.ts';
import { fr } from '../../i18n/fr.ts';
import { firstFreeColor } from './mailbox-colors.ts';
import { startMailboxConnection } from './mailbox-requests.ts';
import { useProviderDeparture } from './use-provider-departure.ts';

/**
 * Adding a Gmail mailbox under a name and a colour: the identity is confirmed first when the api
 * asks, then the browser leaves for Google, which brings the user back once they signed in.
 */
export function useAddMailbox() {
  const mailboxes = useQuery(mailboxesQuery);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [chosenColor, setChosenColor] = useState<PaletteColor>();
  const start = useProviderDeparture(startMailboxConnection);
  const color = chosenColor ?? firstFreeColor(mailboxes.data?.mailboxes ?? []);
  return {
    ...start,
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
