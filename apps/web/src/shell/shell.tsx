import { ColumnResizeHandle, ResizableColumn, ResizableColumns, useColumnRef } from '@mailbox/ui';
import { CatchBoundary, Outlet } from '@tanstack/react-router';
import { ComposeDraftProvider, useOpenComposer } from '../features/compose/index.ts';
import { useShortcut } from '../use-shortcut.ts';
import { useLayout } from './layout.ts';
import { MenuProvider } from './menu.tsx';
import { Sidebar } from './sidebar.tsx';
import { SidebarCrash } from './sidebar-message.tsx';
import {
  SIDEBAR_DEFAULT_SIZE,
  useCollapseOnNarrowWindow,
} from './use-collapse-on-narrow-window.ts';

/**
 * Frame of the app around every screen: the sidebar beside the screen on a computer, the screen
 * alone on a phone, upright or turned, with the sidebar in a menu. The new mail being written lives
 * here, so that moving between screens, or turning the phone, keeps it.
 */
export function Shell() {
  const layout = useLayout();
  const openComposer = useOpenComposer();
  // Here rather than on the "Nouveau mail" button, which is not on screen in every layout.
  useShortcut('newMail', openComposer);
  return (
    <ComposeDraftProvider>
      {layout === 'desktop' ? (
        <DesktopFrame />
      ) : (
        <MenuProvider>
          <div className="h-dvh bg-chrome">
            <Outlet />
          </div>
        </MenuProvider>
      )}
    </ComposeDraftProvider>
  );
}

/**
 * The sidebar, then the screen. The sidebar takes a share of the window; dragged narrower than its
 * minimum, it folds to its icons.
 */
function DesktopFrame() {
  const sidebar = useColumnRef();
  const onSidebarResize = useCollapseOnNarrowWindow(sidebar);
  return (
    // The columns take the height of their parent: the window, so that only the columns scroll.
    <div className="h-dvh min-h-160 bg-chrome">
      <ResizableColumns id="shell">
        <ResizableColumn
          id="sidebar"
          panelRef={sidebar}
          onResize={onSidebarResize}
          defaultSize={SIDEBAR_DEFAULT_SIZE}
          minSize={240}
          maxSize={320}
          collapsible
          collapsedSize={56}
        >
          <CatchBoundary getResetKey={() => 'sidebar'} errorComponent={SidebarCrash}>
            <Sidebar />
          </CatchBoundary>
        </ResizableColumn>
        <ColumnResizeHandle />
        <ResizableColumn id="screen">
          <Outlet />
        </ResizableColumn>
      </ResizableColumns>
    </div>
  );
}
