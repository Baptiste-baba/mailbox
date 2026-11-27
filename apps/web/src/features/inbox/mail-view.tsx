import { ColumnResizeHandle, ResizableColumn, ResizableColumns } from '@mailbox/ui';
import { CatchBoundary, Outlet, useMatch } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';
import { useLayout } from '../../shell/layout.ts';
import { MailList } from './mail-list.tsx';
import { ThreadListCrash } from './thread-list-states.tsx';

/**
 * A mail view: the list of its threads and the open thread, or the new mail. Side by side and
 * resizable on a computer, side by side on a phone turned sideways, one at a time on a phone.
 */
export function MailView() {
  const layout = useLayout();
  const list = (
    <section aria-label={fr.inbox.listLabel} className="flex h-full flex-col">
      <CatchBoundary getResetKey={() => 'mail-list'} errorComponent={ThreadListCrash}>
        <MailList />
      </CatchBoundary>
    </section>
  );
  const pane = (
    <main className="flex h-full min-w-0 flex-col bg-page">
      <Outlet />
    </main>
  );
  if (layout === 'phone') {
    return <PhoneStack list={list} pane={pane} />;
  }
  if (layout === 'landscape') {
    return (
      <div className="flex h-full">
        <div className="w-92 flex-none border-r border-line">{list}</div>
        <div className="min-w-0 flex-1">{pane}</div>
      </div>
    );
  }
  return (
    <ResizableColumns id="mail-view">
      <ResizableColumn id="list" defaultSize="36%" minSize={300} maxSize="50%">
        {list}
      </ResizableColumn>
      <ColumnResizeHandle />
      <ResizableColumn id="thread" minSize={360}>
        {pane}
      </ResizableColumn>
    </ResizableColumns>
  );
}

/**
 * The list, or what was opened from it over the whole screen. The list stays laid out under it,
 * only invisible, so that coming back finds it scrolled where it was.
 */
function PhoneStack({ list, pane }: { list: ReactNode; pane: ReactNode }) {
  const listShown = useMatch({ from: '/_shell/$view/', shouldThrow: false }) !== undefined;
  return (
    <div className="relative h-full">
      <div className={listShown ? 'h-full' : 'invisible h-full'}>{list}</div>
      {!listShown && <div className="absolute inset-0">{pane}</div>}
    </div>
  );
}
