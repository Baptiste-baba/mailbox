import type { Message } from '@mailbox/shared';
import { BarButton } from '@mailbox/ui';
import { ReplyIcon } from 'lucide-react';
import { comingSoonHint } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';
import { replyRecipients } from './participants.ts';

interface ReplyBarProps {
  latestMessage: Message;
  ownAddress: string | undefined;
}

/** The way to reply to the latest message, shown before replying exists. */
export function ReplyBar({ latestMessage, ownAddress }: ReplyBarProps) {
  const label = fr.thread.replyTo(replyRecipients(latestMessage, ownAddress));
  return (
    <BarButton
      icon={<ReplyIcon />}
      shortcut={shortcuts.reply.label}
      disabled
      title={comingSoonHint(label, shortcuts.reply.label)}
    >
      {label}
    </BarButton>
  );
}
