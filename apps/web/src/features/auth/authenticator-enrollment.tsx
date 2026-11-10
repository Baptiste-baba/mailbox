import type { TotpEnrollment } from '@mailbox/shared';
import { CopyButton, QrCode } from '@mailbox/ui';
import type { ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';

// Groups of four, as authenticator apps show their keys: easier to read and type.
function groupedSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

interface AuthenticatorEnrollmentProps {
  enrollment: TotpEnrollment;
  /** The field for the first code of the app, under the key. */
  children: ReactNode;
}

/**
 * A new secret for the authenticator app: the QR code to scan and, beside it, the key in clear for
 * an app that cannot scan, or a password manager on this computer.
 */
export function AuthenticatorEnrollment({ enrollment, children }: AuthenticatorEnrollmentProps) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-8">
      <QrCode value={enrollment.otpauthUri} label={fr.authenticator.qrLabel} className="size-50" />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 rounded-lg bg-field px-4 py-3">
          <span className="text-caption text-ink-2">{fr.authenticator.secretLabel}</span>
          <div className="flex items-center justify-between gap-3">
            {/* Wraps between the groups only, never inside one. */}
            <code className="font-sans text-body font-medium tracking-wide">
              {groupedSecret(enrollment.secret)}
            </code>
            <CopyButton
              text={enrollment.secret}
              label={fr.authenticator.copy}
              copiedLabel={fr.authenticator.copied}
              failedLabel={fr.authenticator.copyFailed}
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
