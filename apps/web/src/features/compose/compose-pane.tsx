import { IconButton, PaneCard, PaneMessage } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { XIcon } from 'lucide-react';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';
import { useShortcut } from '../../use-shortcut.ts';
import { useComposeDraft } from './compose-draft-context.tsx';
import { ComposeFooter } from './compose-footer.tsx';
import { ComposeMessage } from './compose-message.tsx';
import { useCloseComposer } from './use-close-composer.ts';

/**
 * The new mail being written, in a card filling the pane as an open thread does. Closing it keeps
 * what was written; the trash throws it away.
 */
export function ComposePane() {
  const close = useCloseComposer();
  useShortcut('closeComposer', () => {
    // Escape leaves the field first, as a click elsewhere does: a recipient still being typed
    // becomes a chip, and stays in the draft.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    close();
  });
  const { draft, change, discard } = useComposeDraft();
  return (
    <PaneCard>
      <div className="flex flex-none items-center gap-3 border-b border-line py-3 pr-4 pl-6">
        <h2 className="min-w-0 flex-1 truncate text-body font-semibold text-heading">
          {fr.compose.title}
        </h2>
        <IconButton
          label={fr.compose.close}
          shortcut={shortcuts.closeComposer.label}
          onClick={close}
        >
          <XIcon />
        </IconButton>
      </div>
      <ComposeMessage draft={draft} onChange={change} />
      <ComposeFooter
        onDiscard={() => {
          discard();
          close();
        }}
      />
    </PaneCard>
  );
}

/** Stands in for the new mail when it fails to render, so that the list stays usable. */
export function ComposeCrash({ reset }: ErrorComponentProps) {
  return (
    <PaneMessage message={fr.compose.crash} action={{ label: fr.common.retry, onClick: reset }} />
  );
}
