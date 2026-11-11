import { ChipField, FieldLine } from '@mailbox/ui';
import { type ReactNode, useId } from 'react';
import { fr } from '../../i18n/fr.ts';
import { isValidRecipient } from './is-valid-recipient.ts';

interface RecipientsLineProps {
  label: string;
  recipients: string[];
  onChange: (recipients: string[]) => void;
  /** Puts the keyboard in the line as soon as it shows. */
  autoFocus?: boolean;
  trailing?: ReactNode;
}

/** "À", "Cc" or "Cci": each recipient becomes a chip, red when it is not a mail address. */
export function RecipientsLine({
  label,
  recipients,
  onChange,
  autoFocus = false,
  trailing,
}: RecipientsLineProps) {
  const id = useId();
  return (
    <FieldLine label={label} htmlFor={id} trailing={trailing}>
      <ChipField
        id={id}
        values={recipients}
        onChange={onChange}
        isValid={isValidRecipient}
        invalidLabel={fr.compose.invalidAddress}
        removeLabel={fr.compose.removeRecipient}
        placeholder={fr.compose.recipientPlaceholder}
        autoFocus={autoFocus}
      />
    </FieldLine>
  );
}
