import type { TotpEnrollment } from '@mailbox/shared';
import { CopyButton, QrCode } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';

// Groups of four, as authenticator apps show their keys: easier to read and type.
function groupedSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

/**
 * A new secret for the authenticator app: the QR code to scan, and the key in clear for an app
 * that cannot scan, or a password manager on this computer.
 */
export function AuthenticatorEnrollment({ enrollment }: { enrollment: TotpEnrollment }) {
  return (
    <>
      <QrCode value={enrollment.otpauthUri} label={fr.authenticator.qrLabel} className="size-45" />
      <div className="flex flex-col gap-1.5">
        <span className="text-meta font-semibold text-ink2">{fr.authenticator.secretLabel}</span>
        <div className="flex items-center justify-between gap-3">
          <code className="font-sans text-base font-medium tracking-wide break-all">
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
    </>
  );
}
