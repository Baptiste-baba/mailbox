import { Button } from '@mailbox/ui';
import { PencilIcon } from 'lucide-react';
import { fr } from '../i18n/fr.ts';
import { shortcutLabels } from '../shortcuts.ts';
import { hint } from './hint.ts';

/** "Nouveau mail", at full width in the sidebar, or as its icon alone once the sidebar is reduced. */
export function NewMailButton() {
  const title = hint(fr.sidebar.newMail, shortcutLabels.newMail, fr.common.comingSoon);
  return (
    <>
      <div className="@max-rail:hidden">
        <Button
          variant="primary"
          size="lg"
          shortcut={shortcutLabels.newMail}
          disabled
          title={title}
          className="w-full"
        >
          <PencilIcon />
          {fr.sidebar.newMail}
        </Button>
      </div>
      <div className="hidden @max-rail:block">
        <Button
          variant="primary"
          size="lg"
          disabled
          title={title}
          aria-label={fr.sidebar.newMail}
          className="w-full px-0"
        >
          <PencilIcon />
        </Button>
      </div>
    </>
  );
}
