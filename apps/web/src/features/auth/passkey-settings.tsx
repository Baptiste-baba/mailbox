import type { PasskeySummary } from '@mailbox/shared';
import { Button, Card, Skeleton, StateMessage } from '@mailbox/ui';
import { useQuery } from '@tanstack/react-query';
import { KeyRoundIcon, PlusIcon } from 'lucide-react';
import { useId, useState } from 'react';
import { passkeysQuery } from '../../api/passkeys-query.ts';
import { formatDayPhrase } from '../../dates/format-day-phrase.ts';
import { fr } from '../../i18n/fr.ts';
import { AddPasskeyDialog } from './add-passkey-dialog.tsx';
import { passkeysSupported } from './passkey-ceremony.ts';
import { RemovePasskeyDialog } from './remove-passkey-dialog.tsx';

/** The passkeys of the account, in the security settings: adding one, removing one. */
export function PasskeySettings() {
  const titleId = useId();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<PasskeySummary>();
  const hasPasskey = (useQuery(passkeysQuery).data?.passkeys.length ?? 0) > 0;
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-6">
          <h3 id={titleId} className="text-body font-semibold text-ink">
            {fr.passkey.listTitle}
          </h3>
          {/* Where the browser cannot create passkeys, none is offered to add. */}
          {passkeysSupported() && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              <PlusIcon />
              {fr.passkey.add}
            </Button>
          )}
        </div>
        <p className="text-small text-ink-2">{fr.passkey.listIntro}</p>
      </div>
      <Card>
        <PasskeyList onRemove={setRemoving} />
      </Card>
      <AddPasskeyDialog open={adding} onClose={() => setAdding(false)} withPasskey={hasPasskey} />
      <RemovePasskeyDialog passkey={removing} onClose={() => setRemoving(undefined)} />
    </section>
  );
}

/** The passkeys, oldest first, or why there is none to show. */
function PasskeyList({ onRemove }: { onRemove: (passkey: PasskeySummary) => void }) {
  const passkeys = useQuery(passkeysQuery);
  if (passkeys.data === undefined) {
    return passkeys.isError ? (
      <StateMessage
        message={fr.passkey.loadError}
        action={{ label: fr.common.retry, onClick: () => passkeys.refetch() }}
        className="px-6 py-10"
      />
    ) : (
      <PasskeyListSkeleton />
    );
  }
  if (passkeys.data.passkeys.length === 0) {
    return <StateMessage message={fr.passkey.none} className="px-6 py-10" />;
  }
  const now = new Date();
  return (
    <ul className="divide-y divide-line">
      {passkeys.data.passkeys.map((passkey) => (
        <PasskeyRow
          key={passkey.id}
          passkey={passkey}
          now={now}
          onRemove={() => onRemove(passkey)}
        />
      ))}
    </ul>
  );
}

interface PasskeyRowProps {
  passkey: PasskeySummary;
  now: Date;
  onRemove: () => void;
}

function PasskeyRow({ passkey, now, onRemove }: PasskeyRowProps) {
  const lastUsed =
    passkey.lastUsedAt === null ? undefined : formatDayPhrase(passkey.lastUsedAt, now);
  return (
    <li className="flex items-center gap-4 py-4 pr-4 pl-6">
      <KeyRoundIcon aria-hidden="true" className="icon-18 flex-none text-ink-2" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-medium text-ink">{passkey.name}</span>
        <span className="text-small text-ink-2">
          {fr.passkey.history(formatDayPhrase(passkey.createdAt, now), lastUsed)}
        </span>
      </div>
      <Button
        variant="text"
        size="sm"
        onClick={onRemove}
        aria-label={fr.passkey.removeLabel(passkey.name)}
      >
        {fr.passkey.remove}
      </Button>
    </li>
  );
}

/** Two rows in the shape of passkeys, line for line: nothing moves once they arrive. */
function PasskeyListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-line">
      {['first', 'second'].map((row) => (
        <li key={row} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="size-4.5 flex-none" />
          <div className="flex flex-1 flex-col">
            <div className="flex h-5.5 items-center">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-56" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
