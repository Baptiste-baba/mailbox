import { fr } from '../../i18n/fr.ts';

/** What to do without the authenticator app, or without the password: folded until asked. */
export function LostAccess() {
  return (
    <details className="text-center">
      <summary className="mx-auto w-fit cursor-pointer list-none rounded-sm font-medium text-link [&::-webkit-details-marker]:hidden">
        {fr.login.lostAccess}
      </summary>
      <p className="mt-3 text-small text-ink-2">{fr.login.lostAccessHelp}</p>
    </details>
  );
}
