import { Button, Checkbox, CopyButton } from '@mailbox/ui';
import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { AuthStepLayout } from './auth-step-layout.tsx';
import { downloadTextFile } from './download-text-file.ts';

interface SetupRecoveryCodesStepProps {
  username: string;
  recoveryCodes: string[];
  onEnter: () => void;
}

/** The recovery codes, shown this once: the app opens only once the user says they are kept. */
export function SetupRecoveryCodesStep({
  username,
  recoveryCodes,
  onEnter,
}: SetupRecoveryCodesStepProps) {
  const [saved, setSaved] = useState(false);
  const asText = recoveryCodes.join('\n');
  return (
    <AuthStepLayout
      title={fr.setup.recoveryTitle}
      intro={fr.setup.recoveryIntro}
      onSubmit={onEnter}
      actions={
        <Button variant="primary" size="lg" type="submit" disabled={!saved}>
          {fr.setup.enter}
        </Button>
      }
    >
      <div className="grid grid-cols-[1fr_auto] items-center gap-8">
        <ul
          aria-label={fr.setup.recoveryListLabel}
          className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-field px-6 py-4 text-center text-body font-medium tracking-wide"
        >
          {recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <CopyButton
            text={asText}
            label={fr.setup.copyCodes}
            copiedLabel={fr.authenticator.copied}
            failedLabel={fr.authenticator.copyFailed}
            className="w-full"
          />
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() =>
              downloadTextFile(
                fr.setup.downloadFileName,
                `${fr.setup.downloadHeading(username)}\n\n${asText}\n`,
              )
            }
          >
            <DownloadIcon />
            {fr.setup.download}
          </Button>
          <Checkbox
            className="mt-2"
            label={fr.setup.savedConfirmation}
            checked={saved}
            onChange={(event) => setSaved(event.target.checked)}
          />
        </div>
      </div>
    </AuthStepLayout>
  );
}
