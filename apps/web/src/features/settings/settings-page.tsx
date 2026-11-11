import { StateMessage } from '@mailbox/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { useId } from 'react';
import { fr } from '../../i18n/fr.ts';
import { PasskeySettings, SignOutButton } from '../auth/index.ts';

/** The settings of the app: for now, the security of the account. */
export function SettingsPage() {
  const securityId = useId();
  return (
    <main className="h-full overflow-y-auto bg-page">
      <div className="mx-auto flex w-full max-w-216 flex-col px-8 pt-5 pb-16">
        <h1 className="text-title font-semibold text-heading">{fr.settings.title}</h1>
        <section aria-labelledby={securityId} className="mt-8 flex flex-col gap-6">
          <h2 id={securityId} className="text-subject font-semibold text-heading">
            {fr.settings.security}
          </h2>
          <PasskeySettings />
          <div className="border-t border-line pt-6">
            <SignOutButton />
          </div>
        </section>
      </div>
    </main>
  );
}

/** The settings could not show: the rest of the app goes on. */
export function SettingsCrash({ reset }: ErrorComponentProps) {
  return (
    <main className="grid h-full place-items-center bg-page">
      <StateMessage
        message={fr.settings.crash}
        action={{ label: fr.common.retry, onClick: reset }}
      />
    </main>
  );
}
