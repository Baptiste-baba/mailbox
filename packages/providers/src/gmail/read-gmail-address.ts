import { mailboxConnectionFailure } from '@mailbox/shared';
import * as z from 'zod';
import { readAnswer } from '../http/read-answer.ts';
import { sendRequest } from '../http/send-request.ts';
import { readGoogleApiRefusal } from './google-api-refusal.ts';

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
    const refusal = await readGoogleApiRefusal(response);
    throw mailboxConnectionFailure(
      refusal.apiDisabled ? 'apiDisabled' : 'accountUnreadable',
      `Google refused to give the address of the account (${refusal.summary})`,
      refusal.summary,
    );
  }
  const profile = await readAnswer(response, gmailProfileSchema);
  return profile.emailAddress;
}
