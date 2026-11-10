import type { Message } from '@mailbox/shared';
import { BarButton, Button } from '@mailbox/ui';
import { ReplyIcon, SendHorizontalIcon } from 'lucide-react';
import { comingSoonHint } from '../../hint.ts';
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
        aria-disabled
        title={comingSoonHint(label, shortcuts.reply.label)}
        className="flex-1"
      >
        {label}
      </BarButton>
      <Button
        variant="primary"
        aria-disabled
        title={comingSoonHint(fr.thread.send)}
        className="h-11"
      >
        {fr.thread.send}
        <SendHorizontalIcon />
      </Button>
    </div>
  );
}
