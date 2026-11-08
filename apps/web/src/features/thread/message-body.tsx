import type { Message } from '@mailbox/shared';
import { FileChip } from '@mailbox/ui';
import { FileTextIcon } from 'lucide-react';
import { fileKind, formatFileSize } from './format-file-size.ts';

interface Paragraph {
  id: string;
  text: string;
}

// The text is shown as text, never as markup: the content of a mail is untrusted. Its lines stop
// at a reading width, however wide the card.
function paragraphsOf(message: Message): Paragraph[] {
  return message.bodyText
    .split(/\n\s*\n/)
    .filter((text) => text.trim() !== '')
    .map((text, position) => ({ id: `${message.id}-paragraph-${position}`, text }));
}

/** The text of an open message, then its attachments. */
export function MessageBody({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2.5 pt-1.5">
      {paragraphsOf(message).map((paragraph) => (
        <p key={paragraph.id} className="max-w-reading text-mail break-words whitespace-pre-line">
          {paragraph.text}
        </p>
      ))}
      {message.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2 pt-1.5">
          {message.attachments.map((attachment) => (
            <li key={attachment.id} className="max-w-full">
              <FileChip
                icon={<FileTextIcon />}
                name={attachment.fileName}
                details={[fileKind(attachment.fileName), formatFileSize(attachment.size)]
                  .filter((part) => part !== '')
                  .join(', ')}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
