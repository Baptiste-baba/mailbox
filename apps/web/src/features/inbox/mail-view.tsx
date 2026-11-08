import { CatchBoundary, Outlet } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';
import { MailList } from './mail-list.tsx';
import { ThreadListCrash } from './thread-list-states.tsx';

/** A mail view: the list of its threads, then the open thread. */
export function MailView() {
  return (
    <>
      <section
        aria-label={fr.inbox.listLabel}
        className="flex w-93 flex-none flex-col bg-paper shadow-hairline-end"
      >
        <CatchBoundary getResetKey={() => 'mail-list'} errorComponent={ThreadListCrash}>
          <MailList />
        </CatchBoundary>
      </section>
      <main className="flex min-w-0 flex-1 flex-col bg-well">
        <Outlet />
      </main>
    </>
  );
}
