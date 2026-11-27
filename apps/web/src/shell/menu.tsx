import { SidePanel } from '@mailbox/ui';
import { CatchBoundary, useRouter } from '@tanstack/react-router';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { fr } from '../i18n/fr.ts';
import { Sidebar } from './sidebar.tsx';
import { SidebarCrash } from './sidebar-message.tsx';

interface Menu {
  open: () => void;
}

const MenuContext = createContext<Menu | null>(null);

/**
 * The sidebar in a panel over the screen, for a window too small to keep it beside the screen. It
 * closes as soon as the app moves to another screen, whatever led there.
 */
export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => router.subscribe('onResolved', () => setOpen(false)), [router]);
  const menu = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <MenuContext value={menu}>
      {children}
      <SidePanel
        open={isOpen}
        onClose={() => setOpen(false)}
        label={fr.sidebar.menu}
        closeLabel={fr.sidebar.closeMenu}
      >
        <CatchBoundary getResetKey={() => 'menu'} errorComponent={SidebarCrash}>
          <Sidebar />
        </CatchBoundary>
      </SidePanel>
    </MenuContext>
  );
}

/** The menu, or null where the sidebar stays on screen and there is no menu to open. */
export function useMenu(): Menu | null {
  return useContext(MenuContext);
}
