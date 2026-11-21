import { AppError } from '@mailbox/shared';
import * as z from 'zod';
import { readAnswer } from '../http/read-answer.ts';
import { sendRequest } from '../http/send-request.ts';

const PROFILE_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';

const gmailProfileSchema = z.object({ emailAddress: z.email() });

/**
 * The address of the account an access token belongs to.
 * @throws AppError MAILBOX_CONNECTION_FAILED when Google refuses, as it does while the Gmail API
 * is not enabled in the Google Cloud project of the installation.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE
 */
export async function readGmailAddress(accessToken: string): Promise<string> {
  const response = await sendRequest(PROFILE_ENDPOINT, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new AppError(
      'MAILBOX_CONNECTION_FAILED',
      `Google refused to give the address of the account (HTTP ${response.status})`,
    );
  }
  const profile = await readAnswer(response, gmailProfileSchema);
  return profile.emailAddress;
}
