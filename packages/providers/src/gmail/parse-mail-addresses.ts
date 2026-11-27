import type { MailAddress } from '@mailbox/shared';

/**
 * Splits the value of an address header into the mailboxes it lists: commas inside a quoted name
 * or between angle brackets belong to one mailbox.
 */
function splitMailboxes(value: string): string[] {
  const mailboxes: string[] = [];
  let current = '';
  let quoted = false;
  let bracketed = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value.charAt(index);
    if (character === '\\' && quoted) {
      current += character + value.charAt(index + 1);
      index += 1;
      continue;
    }
    if (character === '"' && !bracketed) {
      quoted = !quoted;
    } else if (!quoted && (character === '<' || character === '>')) {
      bracketed = character === '<';
    }
    if (character === ',' && !quoted && !bracketed) {
      mailboxes.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  return [...mailboxes, current];
}

/** The display name as its author typed it: without the quotes and escapes that protect it. */
function readDisplayName(written: string): string {
  const trimmed = written.trim();
  const unquoted =
    trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;
  return unquoted.replace(/\\(.)/g, '$1').trim();
}

function parseMailbox(written: string): MailAddress | undefined {
  const bracketed = /<([^<>]*)>\s*$/.exec(written);
  if (bracketed !== null) {
    const address = (bracketed[1] ?? '').trim();
    const name = readDisplayName(written.slice(0, bracketed.index));
    return address === '' ? undefined : { name, address };
  }
  // No brackets: the address alone, after the name of a group ("Team: a@b, c@d;") when in one.
  const address = written
    .replace(/^[^:@]*:/, '')
    .replace(/;\s*$/, '')
    .trim();
  return address.includes('@') ? { name: '', address } : undefined;
}

/**
 * The people named by an address header (From, To, Cc), as Gmail gives it: already decoded. What
 * names no address, such as "undisclosed-recipients:;", is left out. Addresses are kept as they
 * are written: no format is checked, the header comes from whoever sent the mail.
 */
export function parseMailAddresses(headerValue: string): MailAddress[] {
  return splitMailboxes(headerValue).flatMap((written) => parseMailbox(written) ?? []);
}
