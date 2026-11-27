import { IconButton } from '@mailbox/ui';
import { MenuIcon } from 'lucide-react';
import { fr } from '../i18n/fr.ts';
import { useMenu } from './menu.tsx';

/** Opens the menu, at the top left of the list; absent where the sidebar stays on screen. */
export function MenuButton() {
  const menu = useMenu();
  return (
    menu !== null && (
      <IconButton label={fr.sidebar.openMenu} raised onClick={menu.open}>
        <MenuIcon />
      </IconButton>
    )
  );
}
