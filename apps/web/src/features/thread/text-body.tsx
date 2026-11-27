import type { Message } from '@mailbox/shared';

interface Paragraph {
  id: string;
  text: string;
}

function paragraphsOf(message: Message): Paragraph[] {
  return message.bodyText
    .split(/\n\s*\n/)
    .filter((text) => text.trim() !== '')
    .map((text, position) => ({ id: `${message.id}-paragraph-${position}`, text }));
}

/**
 * The text body of a message, shown as text, never as markup: the content of a mail is untrusted.
 * Its lines stop at a reading width, however wide the pane.
 */
export function TextBody({ message }: { message: Message }) {
  return paragraphsOf(message).map((paragraph) => (
    <p key={paragraph.id} className="max-w-reading text-body break-words whitespace-pre-line">
      {paragraph.text}
    </p>
  ));
}
