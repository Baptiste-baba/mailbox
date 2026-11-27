import { readFileSync } from 'node:fs';
import { type GmailMessage, gmailMessageSchema } from '../gmail-message-schema.ts';

/**
 * A message as the Gmail API answered it for a real mail, scrambled since: letters, digits,
 * addresses and links are made up, structure and markup are the real ones.
 */
export function readGmailFixture(name: string): GmailMessage {
  const answer: unknown = JSON.parse(
    readFileSync(new URL(`./${name}.json`, import.meta.url), 'utf8'),
  );
  return gmailMessageSchema.parse(answer);
}
