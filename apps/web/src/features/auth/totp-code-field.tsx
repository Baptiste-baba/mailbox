import { totpConfirmationSchema } from '@mailbox/shared';
import { TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';

/** Whether a typed code has the form of an authenticator code, before asking the server. */
export function isTotpCode(code: string): boolean {
  return totpConfirmationSchema.shape.totpCode.safeParse(code).success;
}

interface TotpCodeFieldProps {
  value: string;
  onChange: (code: string) => void;
  error: string | undefined;
}

/** The 6-digit code of the authenticator app: a numeric keypad on a phone, filled in by the system. */
export function TotpCodeField({ value, onChange, error }: TotpCodeFieldProps) {
  return (
    <TextField
      label={fr.authenticator.codeLabel}
      placeholder={fr.authenticator.codePlaceholder}
      error={error}
      value={value}
      onChange={(event) => onChange(event.target.value.trim())}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      autoFocus
    />
  );
}
