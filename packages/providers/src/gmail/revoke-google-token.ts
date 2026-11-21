import { AppError } from '@mailbox/shared';
import { sendRequest } from '../http/send-request.ts';

const REVOCATION_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const BAD_REQUEST = 400;

/**
 * Ends the access a refresh token gives at Google.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function revokeGoogleToken(refreshToken: string): Promise<void> {
  const response = await sendRequest(REVOCATION_ENDPOINT, {
    method: 'POST',
    body: new URLSearchParams([['token', refreshToken]]),
  });
  await response.body?.cancel();
  // 400 is how Google refuses a token: one it no longer knows gives no access to end.
  if (!response.ok && response.status !== BAD_REQUEST) {
    throw new AppError(
      'MAIL_PROVIDER_UNAVAILABLE',
      `Google did not end the access (HTTP ${response.status})`,
    );
  }
}
