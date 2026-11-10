import { ColumnResizeHandle, ResizableColumn, ResizableColumns, useColumnRef } from '@mailbox/ui';
import { CatchBoundary, Outlet } from '@tanstack/react-router';
import { Sidebar } from './sidebar.tsx';
import { SidebarCrash } from './sidebar-message.tsx';
import {
  SIDEBAR_DEFAULT_SIZE,
  useCollapseOnNarrowWindow,
} from './use-collapse-on-narrow-window.ts';

/**
 * Frame of the app around every screen: the sidebar, then the screen itself. The sidebar takes a
 * share of the window; dragged narrower than its minimum, it folds to its icons.
 */
export function Shell() {
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
