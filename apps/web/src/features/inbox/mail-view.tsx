import { Outlet } from '@tanstack/react-router';
import { fr } from '../../i18n/fr.ts';

/** A mail view: the list of its threads, then the open thread. */
export function MailView() {
  return (
    <>
      <section
        aria-label={fr.inbox.listLabel}
        className="flex w-93 flex-none flex-col bg-paper shadow-hairline-end"
      />
      <main className="flex min-w-0 flex-1 flex-col bg-well">
        <Outlet />
      </main>
    </>
  );
}
