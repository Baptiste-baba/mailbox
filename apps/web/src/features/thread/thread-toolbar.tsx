import { Button, IconButton } from '@mailbox/ui';
import {
  ArchiveIcon,
  Clock3Icon,
  EllipsisIcon,
  FolderInputIcon,
  LanguagesIcon,
  ReplyIcon,
} from 'lucide-react';
import { comingSoonHint } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

/** The actions on the open thread, shown before they exist: they keep their look but do nothing. */
export function ThreadToolbar() {
  return (
    <div className="flex flex-none items-center gap-1 border-b border-line px-4 py-3">
      <IconButton label={comingSoonHint(fr.thread.archive, shortcuts.archive.label)} aria-disabled>
        <ArchiveIcon />
      </IconButton>
      <IconButton label={comingSoonHint(fr.thread.snooze, shortcuts.snooze.label)} aria-disabled>
        <Clock3Icon />
      </IconButton>
      <IconButton
        label={comingSoonHint(fr.thread.translate, shortcuts.translate.label)}
        aria-disabled
      >
        <LanguagesIcon />
      </IconButton>
      <IconButton label={comingSoonHint(fr.thread.moreActions)} aria-disabled>
        <EllipsisIcon />
      </IconButton>
      <div className="ml-auto flex gap-2">
        <Button variant="secondary" aria-disabled title={comingSoonHint(fr.thread.move)}>
          <FolderInputIcon />
          {fr.thread.move}
        </Button>
        <Button
          variant="primary"
          aria-disabled
          title={comingSoonHint(fr.thread.reply, shortcuts.reply.label)}
        >
          <ReplyIcon />
          {fr.thread.reply}
        </Button>
      </div>
    </div>
  );
}
