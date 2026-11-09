import { Button, Checkbox, CopyButton } from '@mailbox/ui';
import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { downloadTextFile } from './download-text-file.ts';
import { SetupStepLayout } from './setup-step-layout.tsx';

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
    <SetupStepLayout
      title={fr.setup.recoveryTitle}
      intro={fr.setup.recoveryIntro}
      onSubmit={onEnter}
      actions={
        <Button variant="primary" size="lg" type="submit" disabled={!saved}>
          {fr.setup.enter}
        </Button>
      }
    >
      <ul
        aria-label={fr.setup.recoveryListLabel}
        className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg bg-mist2 px-5 py-4 text-base font-medium tracking-wide"
      >
        {recoveryCodes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="-mt-3 flex gap-2">
        <CopyButton
          text={asText}
          label={fr.setup.copyCodes}
          copiedLabel={fr.setup.copied}
          failedLabel={fr.setup.copyFailed}
        />
        <Button
          variant="secondary"
          size="sm"
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
      </div>
      <Checkbox
        label={fr.setup.savedConfirmation}
        checked={saved}
        onChange={(event) => setSaved(event.target.checked)}
      />
    </SetupStepLayout>
  );
}
