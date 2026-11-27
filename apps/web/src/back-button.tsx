import { IconButton } from '@mailbox/ui';
import { ArrowLeftIcon } from 'lucide-react';
import { fr } from './i18n/fr.ts';

/** The way back to the previous screen, at the top left of a screen shown alone on a phone. */
export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <IconButton label={fr.common.back} raised onClick={onBack}>
      <ArrowLeftIcon />
    </IconButton>
  );
}
