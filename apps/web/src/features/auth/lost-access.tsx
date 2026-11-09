import { fr } from '../../i18n/fr.ts';

/** What to do without the authenticator app, or without the password: folded until asked. */
export function LostAccess() {
  return (
    <details className="text-meta">
      <summary className="w-fit cursor-pointer rounded-xs font-medium text-klein">
        {fr.login.lostAccess}
      </summary>
      <p className="mt-2 text-ink2">{fr.login.lostAccessHelp}</p>
    </details>
  );
}
