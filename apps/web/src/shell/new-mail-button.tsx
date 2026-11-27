import { Button, FloatingButton } from '@mailbox/ui';
import { PencilLineIcon } from 'lucide-react';
import { useOpenComposer } from '../features/compose/index.ts';
import { hint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { shortcuts } from '../shortcuts.ts';

/** "Nouveau mail", at full width in the sidebar, or as its icon alone once the sidebar is reduced. */
export function NewMailButton() {
  const openComposer = useOpenComposer();
  return (
    <Button
      variant="primary"
      size="field"
      shortcut={shortcuts.newMail.label}
      title={hint(fr.sidebar.newMail, shortcuts.newMail.label)}
      onClick={openComposer}
      className="mb-3.5 w-full @max-rail:px-0 @max-rail:[&>kbd]:hidden"
    >
      <PencilLineIcon />
      <span className="@max-rail:sr-only">{fr.sidebar.newMail}</span>
    </Button>
  );
}

/** "Nouveau mail" as its pencil alone, floating at the bottom right of the list on a phone. */
export function NewMailFloatingButton() {
  const openComposer = useOpenComposer();
  return (
    <FloatingButton label={fr.sidebar.newMail} onClick={openComposer}>
      <PencilLineIcon />
    </FloatingButton>
  );
}
