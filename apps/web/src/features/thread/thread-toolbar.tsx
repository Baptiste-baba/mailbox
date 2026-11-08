import { Button, IconButton, PaneHeader } from '@mailbox/ui';
import {
  ArchiveIcon,
  ClockIcon,
  EllipsisIcon,
  FolderIcon,
  LanguagesIcon,
  ReplyIcon,
} from 'lucide-react';
import { comingSoonHint } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

/** The actions on the open thread, shown before they exist. */
export function ThreadToolbar() {
  return (
    <PaneHeader className="gap-1">
      <div className="flex gap-1">
        <IconButton label={comingSoonHint(fr.thread.archive, shortcuts.archive.label)} disabled>
          <ArchiveIcon />
        </IconButton>
        <IconButton label={comingSoonHint(fr.thread.snooze, shortcuts.snooze.label)} disabled>
          <ClockIcon />
        </IconButton>
        <IconButton label={comingSoonHint(fr.thread.translate, shortcuts.translate.label)} disabled>
          <LanguagesIcon />
        </IconButton>
        <IconButton label={comingSoonHint(fr.thread.moreActions)} disabled>
          <EllipsisIcon />
        </IconButton>
      </div>
      <div className="ml-auto flex gap-2">
        <Button variant="secondary" disabled title={comingSoonHint(fr.thread.move)}>
          <FolderIcon />
          {fr.thread.move}
        </Button>
        <Button
          variant="primary"
          disabled
          title={comingSoonHint(fr.thread.reply, shortcuts.reply.label)}
        >
          <ReplyIcon />
          {fr.thread.reply}
        </Button>
      </div>
    </PaneHeader>
  );
}
