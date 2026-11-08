import { CatchBoundary, Outlet } from '@tanstack/react-router';
import { Sidebar } from './sidebar.tsx';
import { SidebarCrash } from './sidebar-message.tsx';

/** Frame of the app around every screen: the sidebar, then the screen itself. */
export function Shell() {
  return (
    <div className="flex h-dvh min-h-160 overflow-hidden bg-paper">
      <CatchBoundary getResetKey={() => 'sidebar'} errorComponent={SidebarCrash}>
        <Sidebar />
      </CatchBoundary>
      <Outlet />
    </div>
  );
}
