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

/** "Nouveau", floating at the bottom right of the list on a phone, where the sidebar is in a menu. */
export function NewMailFloatingButton() {
  const openComposer = useOpenComposer();
  return (
    <FloatingButton
      icon={<PencilLineIcon />}
      aria-label={fr.sidebar.newMail}
      onClick={openComposer}
    >
      {fr.sidebar.newMailShort}
    </FloatingButton>
  );
}
