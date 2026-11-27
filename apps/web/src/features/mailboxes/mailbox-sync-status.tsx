import type { MailboxSync } from '@mailbox/shared';
import { Chip, Meter } from '@mailbox/ui';
import { calendarDay } from '../../dates/calendar-day.ts';
import { formatDayPhrase } from '../../dates/format-day-phrase.ts';
import { formatElapsed } from '../../dates/format-elapsed.ts';
import { formatTime } from '../../dates/format-mail-date.ts';
import { fr } from '../../i18n/fr.ts';
import { LOCALE } from '../../locale.ts';

const counts = new Intl.NumberFormat(LOCALE);

type Copying = Extract<MailboxSync, { state: 'copying' }>;
type Interrupted = Extract<MailboxSync, { state: 'interrupted' }>;

/** "Vérifiée à 14:32" today, "Vérifiée hier à 18:42" before. */
function checkedHint(checkedAt: string | null, now: Date): string | undefined {
  if (checkedAt === null) {
    return undefined;
  }
  const time = formatTime(new Date(checkedAt));
  return calendarDay(new Date(checkedAt)).day === calendarDay(now).day
    ? fr.mailboxes.checkedToday(time)
    : fr.mailboxes.checkedOn(formatDayPhrase(checkedAt, now), time);
}

// Mails that arrive during the copy count among those copied: the count stops at the total.
function copiedSoFar({ copiedCount, totalCount }: Copying & { totalCount: number }): number {
  return Math.min(copiedCount, totalCount);
}

function interruptionText({ reason, since }: Interrupted, now: Date): string {
  switch (reason) {
    case 'providerUnavailable':
      return fr.mailboxes.interruptions.providerUnavailable(formatElapsed(since, now));
    case 'providerNotConfigured':
      return fr.mailboxes.interruptions.providerNotConfigured;
    case 'unexpected':
      return fr.mailboxes.interruptions.unexpected(formatElapsed(since, now));
  }
}

/** How the synchronisation of a mailbox goes, at the end of its row in the settings. */
export function MailboxSyncBadge({ sync, now }: { sync: MailboxSync; now: Date }) {
  if (sync.state === 'interrupted') {
    return <Chip tone="warn">{fr.common.syncInterrupted}</Chip>;
  }
  if (sync.state === 'copying') {
    const { totalCount } = sync;
    return (
      <span className="flex-none text-small text-ink-2">
        {totalCount === null
          ? fr.mailboxes.copyStarting
          : fr.mailboxes.copying(
              counts.format(copiedSoFar({ ...sync, totalCount })),
              counts.format(totalCount),
            )}
      </span>
    );
  }
  return (
    <span className="flex-none text-small text-ink-2" title={checkedHint(sync.checkedAt, now)}>
      {fr.mailboxes.upToDate}
    </span>
  );
}

/** Under the address of a mailbox: the progress of its copy, or why it is not read. */
export function MailboxSyncDetail({ sync, now }: { sync: MailboxSync; now: Date }) {
  if (sync.state === 'copying' && sync.totalCount !== null && sync.totalCount > 0) {
    const { totalCount } = sync;
    return (
      <div className="pt-2">
        <Meter
          label={fr.mailboxes.copyProgress}
          value={copiedSoFar({ ...sync, totalCount })}
          max={totalCount}
        />
      </div>
    );
  }
  if (sync.state === 'interrupted') {
    return <span className="pt-0.5 text-small text-warn">{interruptionText(sync, now)}</span>;
  }
  return null;
}
