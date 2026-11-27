import type { Message } from '@mailbox/shared';
import { BarButton, Button } from '@mailbox/ui';
import { ReplyIcon, SendHorizontalIcon } from 'lucide-react';
import { comingSoon } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';
import { replyRecipients } from './participants.ts';

interface ReplyBarProps {
  latestMessage: Message;
  ownAddress: string | undefined;
}

/** The way to reply to the latest message, at the foot of the thread, shown before replying exists. */
export function ReplyBar({ latestMessage, ownAddress }: ReplyBarProps) {
  const label = fr.thread.replyTo(replyRecipients(latestMessage, ownAddress));
  return (
    <div className="flex flex-none gap-2.5 border-t border-line px-4 py-3.5">
      <BarButton
        icon={<ReplyIcon />}
        {...comingSoon(label, shortcuts.reply.label)}
        className="flex-1"
      >
        {label}
      </BarButton>
      {/* On a phone, the icon alone leaves the room to the reply. */}
      <Button
        variant="primary"
        size="field"
        {...comingSoon(fr.thread.send)}
        className="phone:w-11 phone:px-0"
      >
        <span className="phone:sr-only">{fr.thread.send}</span>
        <SendHorizontalIcon />
      </Button>
    </div>
  );
}
