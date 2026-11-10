import { fr } from '../i18n/fr.ts';

/** Shown only when the first answer of the server is slow to come. */
export function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-chrome p-6">
      <p role="status" className="text-ink-2">
        {fr.loading}
      </p>
    </main>
  );
}
