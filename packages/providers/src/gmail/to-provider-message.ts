import type { MailAddress, ProviderAttachment, ProviderMessage } from '@mailbox/shared';
import type { GmailMessage, GmailPart } from './gmail-message-schema.ts';
import { parseMailAddresses } from './parse-mail-addresses.ts';
import { unescapeGmailSnippet } from './unescape-gmail-snippet.ts';

const UNREAD_LABEL = 'UNREAD';
const INBOX_LABEL = 'INBOX';
/** Gmail names the labels of the user "Label_" and a number; its own are words in capitals. */
const USER_LABEL_PREFIX = 'Label_';

function header(part: GmailPart, name: string): string | undefined {
  return part.headers?.find((candidate) => candidate.name.toLowerCase() === name)?.value;
}

/** A part that is a file, attached or shown in the body: Gmail keeps its content apart. */
function isFile(part: GmailPart): boolean {
  return (part.filename ?? '') !== '' || part.body?.attachmentId !== undefined;
}

/** The parts that are not sets of parts, in the order the mail carries them. */
function leaves(part: GmailPart): GmailPart[] {
  return part.parts === undefined ? [part] : part.parts.flatMap(leaves);
}

/**
 * The body of one kind, text or HTML. Gmail gives every text in UTF-8, whatever charset the part
 * declares. A mail made of several bodies of the same kind, as mailing lists do by adding a
 * footer, reads as one.
 */
function readBody(parts: GmailPart[], mimeType: string): string | null {
  const texts = parts
    .filter((part) => part.mimeType.toLowerCase() === mimeType && !isFile(part))
    .map((part) => Buffer.from(part.body?.data ?? '', 'base64url').toString('utf8'));
  return texts.length === 0 ? null : texts.join('\n');
}

function toAttachment(part: GmailPart, bodyHtml: string | null): ProviderAttachment {
  const contentId = header(part, 'content-id')?.replace(/^\s*<|>\s*$/g, '');
  // Many senders give an id to every file: only one the body displays is part of the body.
  const shownInBody =
    contentId !== undefined && contentId !== '' && bodyHtml?.includes(`cid:${contentId}`) === true;
  return {
    fileName: part.filename ?? '',
    mimeType: part.mimeType.toLowerCase(),
    size: part.body?.size ?? 0,
    contentId: shownInBody ? contentId : null,
  };
}

/** The sender of a mail; one that names none, or nobody readable, has an empty address. */
function readSender(fromHeader: string | undefined): MailAddress {
  const [sender] = parseMailAddresses(fromHeader ?? '');
  return sender ?? { name: (fromHeader ?? '').trim(), address: '' };
}

/**
 * A Gmail message as the rest of the app reads a mail. Everything in the result but the ids and
 * the date comes from whoever wrote the mail.
 */
export function toProviderMessage(message: GmailMessage): ProviderMessage {
  const { payload } = message;
  const labelIds = message.labelIds ?? [];
  const parts = leaves(payload);
  const bodyHtml = readBody(parts, 'text/html');
  return {
    providerMessageId: message.id,
    providerThreadId: message.threadId,
    subject: (header(payload, 'subject') ?? '').trim(),
    from: readSender(header(payload, 'from')),
    to: parseMailAddresses(header(payload, 'to') ?? ''),
    cc: parseMailAddresses(header(payload, 'cc') ?? ''),
    sentAt: new Date(Number(message.internalDate)),
    snippet: unescapeGmailSnippet(message.snippet ?? '').trim(),
    bodyText: readBody(parts, 'text/plain'),
    bodyHtml,
    unread: labelIds.includes(UNREAD_LABEL),
    inInbox: labelIds.includes(INBOX_LABEL),
    providerFolderIds: labelIds.filter((labelId) => labelId.startsWith(USER_LABEL_PREFIX)),
    attachments: parts.filter(isFile).map((part) => toAttachment(part, bodyHtml)),
  };
}
