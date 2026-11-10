import { Button, IconButton } from '@mailbox/ui';
import {
  ArchiveIcon,
  Clock3Icon,
  EllipsisIcon,
  FolderInputIcon,
  LanguagesIcon,
  ReplyIcon,
} from 'lucide-react';
import { comingSoon } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

/** The actions on the open thread, shown before they exist: they keep their look but do nothing. */
export function ThreadToolbar() {
  return (
    <div className="flex flex-none items-center gap-1 border-b border-line px-4 py-3">
      <IconButton
        label={fr.thread.archive}
        {...comingSoon(fr.thread.archive, shortcuts.archive.label)}
      >
        <ArchiveIcon />
      </IconButton>
      <IconButton
        label={fr.thread.snooze}
        {...comingSoon(fr.thread.snooze, shortcuts.snooze.label)}
      >
        <Clock3Icon />
      </IconButton>
      <IconButton
        label={fr.thread.translate}
        {...comingSoon(fr.thread.translate, shortcuts.translate.label)}
      >
        <LanguagesIcon />
      </IconButton>
      <IconButton label={fr.thread.moreActions} {...comingSoon(fr.thread.moreActions)}>
        <EllipsisIcon />
      </IconButton>
      <div className="ml-auto flex gap-2">
        <Button variant="secondary" {...comingSoon(fr.thread.move)}>
          <FolderInputIcon />
          {fr.thread.move}
        </Button>
        <Button variant="primary" {...comingSoon(fr.thread.reply, shortcuts.reply.label)}>
          <ReplyIcon />
          {fr.thread.reply}
        </Button>
      </div>
    </div>
  );
}
