import type { MailAddress, ProviderMessage } from '@mailbox/shared';

/** Postgres stores any character in a text but the null one, which some mails carry. */
function storableText(text: string): string {
  return text.replaceAll('\u0000', '');
}

function storableAddress({ name, address }: MailAddress): MailAddress {
  return { name: storableText(name), address: storableText(address) };
}

/** A mail whose every text Postgres accepts. */
export function storableMessage(mail: ProviderMessage): ProviderMessage {
  return {
    ...mail,
    subject: storableText(mail.subject),
    from: storableAddress(mail.from),
    to: mail.to.map(storableAddress),
    cc: mail.cc.map(storableAddress),
    snippet: storableText(mail.snippet),
    bodyText: mail.bodyText === null ? null : storableText(mail.bodyText),
    bodyHtml: mail.bodyHtml === null ? null : storableText(mail.bodyHtml),
    attachments: mail.attachments.map((file) => ({
      ...file,
      fileName: storableText(file.fileName),
      mimeType: storableText(file.mimeType),
      contentId: file.contentId === null ? null : storableText(file.contentId),
    })),
  };
}
