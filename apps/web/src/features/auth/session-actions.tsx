import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { SignOutButton } from './sign-out-button.tsx';
import { SignOutOthersButton } from './sign-out-others-button.tsx';

/** Signing out: every other device, or this one. */
export function SessionActions() {
  const [othersSignedOut, setOthersSignedOut] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <SignOutOthersButton onSignedOut={() => setOthersSignedOut(true)} />
        <SignOutButton />
      </div>
      {/* A live region: screen readers say it once the dialog has closed. */}
      <p role="status" className="flex items-center gap-2 text-small text-success">
        {othersSignedOut && (
          <>
            <CheckIcon aria-hidden="true" className="icon-16" />
            {fr.signOut.othersDone}
          </>
        )}
      </p>
    </div>
  );
}
