import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from './icon-button.tsx';
import { TextField, type TextFieldProps } from './text-field.tsx';

interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'trailing'> {
  /** Name of the toggle that shows the password in clear, such as "Afficher le mot de passe". */
  revealLabel: string;
}

/** A password field, hidden by default, with a toggle to check what was typed. */
export function PasswordField({ revealLabel, ...props }: PasswordFieldProps) {
  const [revealed, setRevealed] = useState(false);
  return (
    <TextField
      {...props}
      type={revealed ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        <IconButton label={revealLabel} pressed={revealed} onClick={() => setRevealed(!revealed)}>
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      }
    />
  );
}
