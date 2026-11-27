import type { Message } from '@mailbox/shared';
import { FileChip } from '@mailbox/ui';
import { FileTextIcon } from 'lucide-react';
import { fileKind, formatFileSize } from './format-file-size.ts';
import { HtmlMessageBody } from './html-message-body.tsx';
import { TextBody } from './text-body.tsx';

/**
 * The body of an open message, its HTML when it has one, else its text, then its attachments, in
 * the second column of the message.
 */
export function MessageBody({ message }: { message: Message }) {
  return (
    <div className="col-start-2 flex min-w-0 flex-col gap-3.5 pt-4.5">
      {message.hasHtml ? <HtmlMessageBody message={message} /> : <TextBody message={message} />}
      {message.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2 pt-1">
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
