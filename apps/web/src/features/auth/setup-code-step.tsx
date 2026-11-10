import { setupEnrollmentRequestSchema } from '@mailbox/shared';
import { Button, TextField } from '@mailbox/ui';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';

interface SetupCodeStepProps {
  initialCode: string;
  /** Why the server refused the code typed before, if it did. */
  rejection: string | undefined;
  onDone: (setupCode: string) => void;
}

/** The setup code from the server logs: only the person running the server can read it. */
export function SetupCodeStep({ initialCode, rejection, onDone }: SetupCodeStepProps) {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState(rejection);
  const submit = () => {
    const parsed = setupEnrollmentRequestSchema.shape.setupCode.safeParse(code);
    if (parsed.success) {
      onDone(parsed.data);
    } else {
      setError(fr.setup.codeFormat);
    }
  };
  return (
    <AuthStepLayout
      title={fr.setup.codeTitle}
      intro={fr.setup.codeIntro}
      onSubmit={submit}
      actions={
        <Button variant="primary" size="lg" type="submit">
          {fr.common.continue}
        </Button>
      }
    >
      <TextField
        label={fr.setup.codeLabel}
        hint={fr.setup.codeHint}
        error={error}
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
          setError(undefined);
        }}
        placeholder={fr.auth.groupedCodePlaceholder}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        autoFocus
      />
    </AuthStepLayout>
  );
}
