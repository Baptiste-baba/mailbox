import { fr } from '../../i18n/fr.ts';

/** What to do without the authenticator app, or without the password: folded until asked. */
export function LostAccess() {
  return (
    <details className="text-caption">
      <summary className="w-fit cursor-pointer rounded-sm font-medium text-link">
        {fr.login.lostAccess}
      </summary>
      <p className="mt-2 text-ink-2">{fr.login.lostAccessHelp}</p>
    </details>
  );
}
