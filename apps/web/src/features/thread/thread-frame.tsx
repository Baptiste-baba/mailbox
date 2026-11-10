import { Card } from '@mailbox/ui';
import type { ReactNode } from 'react';

/** The card of the thread pane, filling it inside a margin, whatever it shows: a thread or a state. */
export function ThreadFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 p-5">
      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</Card>
    </div>
  );
}
