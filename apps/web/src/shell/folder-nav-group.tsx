import { NavGroup, NavGroupAction } from '@mailbox/ui';
import { comingSoon } from '../hint.ts';
import { fr } from '../i18n/fr.ts';

/** "Dossiers": announced by its heading, and empty until the feature that fills it exists. */
export function FolderNavGroup() {
  return (
    <NavGroup
      title={fr.sidebar.folders}
      action={
        <NavGroupAction
          {...comingSoon(fr.sidebar.newFolderLabel)}
          aria-label={fr.sidebar.newFolderLabel}
        >
          {fr.sidebar.newFolder}
        </NavGroupAction>
      }
      // Reduced to icons, the sidebar hides headings: nothing of the group would show but its line.
      className="@max-rail:hidden"
    />
  );
}
