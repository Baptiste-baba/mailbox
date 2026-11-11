import { Button } from '@mailbox/ui';
import { PencilLineIcon } from 'lucide-react';
import { useOpenComposer } from '../features/compose/index.ts';
import { hint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { shortcuts } from '../shortcuts.ts';
import { useShortcut } from '../use-shortcut.ts';

/** "Nouveau mail", at full width in the sidebar, or as its icon alone once the sidebar is reduced. */
export function NewMailButton() {
  const openComposer = useOpenComposer();
  useShortcut('newMail', openComposer);
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
