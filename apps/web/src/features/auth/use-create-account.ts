import type { TotpEnrollment } from '@mailbox/shared';
import type { Credentials } from './credentials.ts';
import { createAccount } from './setup-requests.ts';
import { useTotpConfirmation } from './use-totp-confirmation.ts';

export interface CreateAccountOptions {
  setupCode: string;
  account: Credentials;
  enrollment: TotpEnrollment;
  /** Handles what concerns the whole setup; gives the message to show here, if any. */
  onFailure: (error: unknown) => string | undefined;
  onCreated: (recoveryCodes: string[]) => void;
}

/** The first code of the authenticator app, and the creation of the account it confirms. */
export function useCreateAccount(options: CreateAccountOptions) {
  const { setupCode, account, enrollment, onFailure, onCreated } = options;
  return useTotpConfirmation({
    send: (totpCode) =>
      createAccount({ setupCode, ...account, totpSecret: enrollment.secret, totpCode }),
    onConfirmed: (result) => onCreated(result.recoveryCodes),
    onFailure,
  });
}
