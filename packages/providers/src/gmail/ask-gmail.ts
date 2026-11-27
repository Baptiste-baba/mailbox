import { AppError } from '@mailbox/shared';
import type * as z from 'zod';
import { readAnswer } from '../http/read-answer.ts';
import { sendRequest } from '../http/send-request.ts';
import { readGoogleApiRefusal } from './google-api-refusal.ts';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const NOT_FOUND = 404;

/**
 * Asks the Gmail API for what is at `path` in the mailbox of the access; null when Gmail has
 * nothing there.
 * @param absentStatus The status by which Gmail says it has nothing there: 404 for a message, 400
 * for a page of a listing it no longer knows.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE when Gmail cannot be reached, refuses, keeps asking to
 * slow down, or answers something else than it documents.
 */
export async function askGmailIfThere<Schema extends z.ZodType>(
  accessToken: string,
  path: string,
  schema: Schema,
  absentStatus: number = NOT_FOUND,
): Promise<z.output<Schema> | null> {
  const response = await sendRequest(
    `${GMAIL_API}${path}`,
    { headers: { authorization: `Bearer ${accessToken}` } },
    async (refusal) => (await readGoogleApiRefusal(refusal)).rateLimited,
  );
  if (response.status === absentStatus) {
    await response.body?.cancel();
    return null;
  }
  if (!response.ok) {
    const refusal = await readGoogleApiRefusal(response);
    throw new AppError('MAIL_PROVIDER_UNAVAILABLE', `Gmail refused a request (${refusal.summary})`);
  }
  return readAnswer(response, schema);
}

/**
 * Asks the Gmail API for what is at `path` in the mailbox of the access.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE when Gmail cannot be reached, refuses, has nothing
 * there, or answers something else than it documents.
 */
export async function askGmail<Schema extends z.ZodType>(
  accessToken: string,
  path: string,
  schema: Schema,
): Promise<z.output<Schema>> {
  const answer = await askGmailIfThere(accessToken, path, schema);
  if (answer === null) {
    throw new AppError('MAIL_PROVIDER_UNAVAILABLE', 'Gmail refused a request (HTTP 404)');
  }
  return answer;
}
