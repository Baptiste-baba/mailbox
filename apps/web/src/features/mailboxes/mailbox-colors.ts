import { type MailboxSummary, type PaletteColor, paletteColorSchema } from '@mailbox/shared';
import { fr } from '../../i18n/fr.ts';

/** The colours a mailbox can take, in the order of the palette, each with its name. */
export const mailboxColors = paletteColorSchema.options.map((color) => ({
  color,
  label: fr.mailboxes.colors[color],
}));

/** The first colour no mailbox has yet, to tell a new one apart; the first of the palette once all are taken. */
export function firstFreeColor(mailboxes: readonly MailboxSummary[]): PaletteColor {
  const taken = new Set(mailboxes.map((mailbox) => mailbox.color));
  const free = paletteColorSchema.options.find((color) => !taken.has(color));
  return free ?? 'navy';
}
