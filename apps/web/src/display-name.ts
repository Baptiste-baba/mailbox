import type { MailAddress } from '@mailbox/shared';
import { fr } from './i18n/fr.ts';

/**
 * How someone of a mail reads: their name, else their address. A mail may name no sender the app
 * could read: it says so.
 */
export function displayName(person: MailAddress): string {
  return person.name || person.address || fr.common.unknownSender;
}
