import { Button, IconButton } from '@mailbox/ui';
import { PaperclipIcon, SendHorizontalIcon, Trash2Icon } from 'lucide-react';
import { comingSoon } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

/**
 * The actions at the foot of the new mail, "Envoyer" where it stands under an open thread.
 * Attaching and sending are shown before they exist: sending needs the real mailboxes.
 */
export function ComposeFooter({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="flex flex-none items-center gap-1 border-t border-line px-4 py-3.5">
      <IconButton label={fr.compose.attach} {...comingSoon(fr.compose.attach)}>
        <PaperclipIcon />
      </IconButton>
      <IconButton label={fr.compose.discard} onClick={onDiscard}>
        <Trash2Icon />
      </IconButton>
      <Button
        variant="primary"
        size="field"
        {...comingSoon(fr.compose.send, shortcuts.send.label)}
        className="ml-auto"
      >
        {fr.compose.send}
        <SendHorizontalIcon />
      </Button>
    </div>
  );
}
