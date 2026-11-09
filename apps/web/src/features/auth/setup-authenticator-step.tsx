import { Button, CopyButton, QrCode, TextField } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { SetupStepLayout } from './setup-step-layout.tsx';
import { type CreateAccountOptions, useCreateAccount } from './use-create-account.ts';

// Groups of four, as authenticator apps show their keys: easier to read and type.
function groupedSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

interface SetupAuthenticatorStepProps extends CreateAccountOptions {
  onBack: () => void;
}

/** The authenticator app takes the secret, and proves it with its first code: the account is created. */
export function SetupAuthenticatorStep({ onBack, ...options }: SetupAuthenticatorStepProps) {
  const form = useCreateAccount(options);
  return (
    <SetupStepLayout
      title={fr.setup.authenticatorTitle}
      intro={fr.setup.authenticatorIntro}
      onSubmit={form.submit}
      error={form.formError}
      actions={
        <>
          <Button variant="primary" size="lg" type="submit" disabled={form.pending}>
            {fr.setup.createAccount}
          </Button>
          <Button variant="text" onClick={onBack}>
            {fr.setup.back}
          </Button>
        </>
      }
    >
      <QrCode value={options.enrollment.otpauthUri} label={fr.setup.qrLabel} className="size-45" />
      <SecretKey secret={options.enrollment.secret} />
      <TextField
        label={fr.setup.totpCodeLabel}
        error={form.codeError}
        value={form.code}
        onChange={(event) => form.changeCode(event.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
      />
    </SetupStepLayout>
  );
}

/** The secret in clear, for an app that cannot scan, or a password manager on this computer. */
function SecretKey({ secret }: { secret: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-meta font-semibold text-ink2">{fr.setup.secretLabel}</span>
      <div className="flex items-center justify-between gap-3">
        <code className="font-sans text-base font-medium tracking-wide break-all">
          {groupedSecret(secret)}
        </code>
        <CopyButton
          text={secret}
          label={fr.setup.copy}
          copiedLabel={fr.setup.copied}
          failedLabel={fr.setup.copyFailed}
        />
      </div>
    </div>
  );
}
