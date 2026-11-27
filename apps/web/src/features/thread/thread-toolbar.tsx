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
import { type Layout, useLayout } from '../../shell/layout.ts';
import { shortcuts } from '../../shortcuts.ts';
import { ThreadBackButton } from './thread-back-button.tsx';

/**
 * The actions on the open thread, shown before they exist: they keep their look but do nothing. On
 * a phone, the way back comes first and the actions are icons; replying is the bar at the foot.
 */
export function ThreadToolbar() {
  const layout = useLayout();
  return (
    <div className="flex flex-none items-center gap-1 border-b border-line px-4 py-3 phone:py-2 phone:pr-2">
      {layout === 'phone' ? <PhoneActions /> : <WideActions layout={layout} />}
    </div>
  );
}

function PhoneActions() {
  return (
    <>
      <ThreadBackButton />
      <div className="ml-auto flex gap-1">
        <ArchiveButton />
        <SnoozeButton />
        <IconButton label={fr.thread.move} {...comingSoon(fr.thread.move)}>
          <FolderInputIcon />
        </IconButton>
        <MoreButton />
      </div>
    </>
  );
}

// Turned sideways, a phone has no room for translating beside the rest.
function WideActions({ layout }: { layout: Exclude<Layout, 'phone'> }) {
  return (
    <>
      <ArchiveButton />
      <SnoozeButton />
      {layout === 'desktop' && (
        <IconButton
          label={fr.thread.translate}
          {...comingSoon(fr.thread.translate, shortcuts.translate.label)}
        >
          <LanguagesIcon />
        </IconButton>
      )}
      <MoreButton />
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
    </>
  );
}

function ArchiveButton() {
  return (
    <IconButton
      label={fr.thread.archive}
      {...comingSoon(fr.thread.archive, shortcuts.archive.label)}
    >
      <ArchiveIcon />
    </IconButton>
  );
}

function SnoozeButton() {
  return (
    <IconButton label={fr.thread.snooze} {...comingSoon(fr.thread.snooze, shortcuts.snooze.label)}>
      <Clock3Icon />
    </IconButton>
  );
}

function MoreButton() {
  return (
    <IconButton label={fr.thread.moreActions} {...comingSoon(fr.thread.moreActions)}>
      <EllipsisIcon />
    </IconButton>
  );
}
