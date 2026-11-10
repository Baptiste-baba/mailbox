import { ColumnResizeHandle, ResizableColumn, ResizableColumns } from '@mailbox/ui';
import { CatchBoundary, Outlet } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { MailList } from './mail-list.tsx';
import { ThreadListCrash } from './thread-list-states.tsx';

/** A mail view: the list of its threads, then the open thread, side by side and resizable. */
export function MailView() {
  return (
    <ResizableColumns id="mail-view">
      <ResizableColumn id="list" defaultSize="30%" minSize={300} maxSize="50%">
        <section aria-label={fr.inbox.listLabel} className="flex h-full flex-col bg-chrome">
          <CatchBoundary getResetKey={() => 'mail-list'} errorComponent={ThreadListCrash}>
            <MailList />
          </CatchBoundary>
        </section>
      </ResizableColumn>
      <ColumnResizeHandle />
      <ResizableColumn id="thread" minSize={360}>
        <main className="flex h-full min-w-0 flex-col bg-page">
          <Outlet />
        </main>
      </ResizableColumn>
    </ResizableColumns>
  );
}
