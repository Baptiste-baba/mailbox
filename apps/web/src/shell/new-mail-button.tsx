import { Button } from '@mailbox/ui';
import { PencilLineIcon } from 'lucide-react';
import { comingSoonHint } from '../hint.ts';
import { fr } from '../i18n/fr.ts';
import { shortcuts } from '../shortcuts.ts';

/** "Nouveau mail", at full width in the sidebar, or as its icon alone once the sidebar is reduced. */
export function NewMailButton() {
  const title = comingSoonHint(fr.sidebar.newMail, shortcuts.newMail.label);
  return (
    <div className="mb-3.5">
      <div className="@max-rail:hidden">
        <Button
          variant="primary"
          shortcut={shortcuts.newMail.label}
          aria-disabled
          title={title}
          className="h-11 w-full"
        >
          <PencilLineIcon />
          {fr.sidebar.newMail}
        </Button>
      </div>
      <div className="hidden @max-rail:block">
        <Button
          variant="primary"
          aria-disabled
          title={title}
          aria-label={fr.sidebar.newMail}
          className="h-11 w-full px-0"
        >
          <PencilLineIcon />
        </Button>
      </div>
    </div>
  );
}
