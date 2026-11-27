import { PaneCard, PaneMessage } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { useLayout } from '../../shell/layout.ts';
import { useShortcut } from '../../use-shortcut.ts';
import { AttachButton, DiscardButton } from './compose-actions.tsx';
import { useComposeDraft } from './compose-draft-context.tsx';
import { ComposeFooter } from './compose-footer.tsx';
import { ComposeHeader, PhoneComposeHeader } from './compose-header.tsx';
import { ComposeMessage } from './compose-message.tsx';
import { useCloseComposer } from './use-close-composer.ts';

/**
 * The new mail being written, in a card filling the pane as an open thread does. Closing it keeps
 * what was written; the trash throws it away. On a phone, "Envoyer" goes to the top and the other
 * actions join the formatting, in the one bar the keyboard leaves room for.
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
  const discardAndClose = () => {
    discard();
    close();
  };
  if (useLayout() === 'phone') {
    return (
      <div className="flex h-full flex-col bg-surface">
        <PhoneComposeHeader onClose={close} />
        <ComposeMessage
          draft={draft}
          onChange={change}
          barEnd={
            <>
              <AttachButton />
              <DiscardButton onDiscard={discardAndClose} />
            </>
          }
        />
      </div>
    );
  }
  return (
    <PaneCard>
      <ComposeHeader onClose={close} />
      <ComposeMessage draft={draft} onChange={change} />
      <ComposeFooter onDiscard={discardAndClose} />
    </PaneCard>
  );
}

/** Stands in for the new mail when it fails to render, so that the list stays usable. */
export function ComposeCrash({ reset }: ErrorComponentProps) {
  return (
    <PaneMessage message={fr.compose.crash} action={{ label: fr.common.retry, onClick: reset }} />
  );
}
