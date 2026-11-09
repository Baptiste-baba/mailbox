import {
  type SetupEnrollmentRequest,
  type SetupRequest,
  setupResponseSchema,
  totpEnrollmentSchema,
} from '@mailbox/shared';
import { postApi } from '../../api/fetch-api.ts';

/** Checks the setup code, and gives a new secret for the authenticator app. */
export function startEnrollment(request: SetupEnrollmentRequest) {
  return postApi('/auth/setup/totp-secret', request, totpEnrollmentSchema);
}

/** Creates the account and signs in on this device; gives the recovery codes, this once. */
export function createAccount(request: SetupRequest) {
  return postApi('/auth/setup', request, setupResponseSchema);
}
