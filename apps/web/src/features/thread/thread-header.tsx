import type { ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';

/** Subject of the thread, then what is given under it to tell who takes part. */
export function ThreadHeader({ subject, children }: { subject: string; children: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <h2 className="text-subject font-semibold break-words">{subject || fr.inbox.noSubject}</h2>
      {children}
    </header>
  );
}
