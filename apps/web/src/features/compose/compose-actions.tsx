import { Button, IconButton } from '@mailbox/ui';
import { PaperclipIcon, SendHorizontalIcon, Trash2Icon } from 'lucide-react';
import { comingSoon } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

// Attaching and sending are shown before they exist: sending needs the real mailboxes.

export function AttachButton() {
  return (
    <IconButton label={fr.compose.attach} {...comingSoon(fr.compose.attach)}>
      <PaperclipIcon />
    </IconButton>
  );
}

export function DiscardButton({ onDiscard }: { onDiscard: () => void }) {
  return (
    <IconButton label={fr.compose.discard} onClick={onDiscard}>
      <Trash2Icon />
    </IconButton>
  );
}

interface SendButtonProps {
  /** Round and lifted, over the fields of a phone. */
  floating?: boolean;
  className?: string;
}

export function SendButton({ floating = false, className }: SendButtonProps) {
  return (
    <Button
      variant="primary"
      size="field"
      floating={floating}
      {...comingSoon(fr.compose.send, shortcuts.send.label)}
      className={className}
    >
      {fr.compose.send}
      <SendHorizontalIcon />
    </Button>
  );
}
