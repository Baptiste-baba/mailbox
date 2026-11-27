import { IconButton } from '@mailbox/ui';
import { XIcon } from 'lucide-react';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';
import { SendButton } from './compose-actions.tsx';

/** The title of the new mail, then the way to close it, which keeps what was written. */
export function ComposeHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-none items-center gap-3 border-b border-line py-3 pr-4 pl-6 compact:pt-screen-3 compact:pl-4">
      <h2 className="min-w-0 flex-1 truncate text-body font-semibold text-heading">
        {fr.compose.title}
      </h2>
      <CloseButton onClose={onClose} />
    </div>
  );
}

/**
 * On a phone: the way to close, which keeps what was written, the title, then "Envoyer" at the
 * top, where the keyboard never hides it.
 */
export function PhoneComposeHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-none items-center gap-3 px-2 pt-screen-2 pb-2">
      <CloseButton onClose={onClose} raised />
      <h2 className="min-w-0 flex-1 truncate text-large font-semibold text-heading">
        {fr.compose.title}
      </h2>
      <SendButton floating />
    </div>
  );
}

function CloseButton({ onClose, raised = false }: { onClose: () => void; raised?: boolean }) {
  return (
    <IconButton
      label={fr.compose.close}
      shortcut={shortcuts.closeComposer.label}
      raised={raised}
      onClick={onClose}
    >
      <XIcon />
    </IconButton>
  );
}
