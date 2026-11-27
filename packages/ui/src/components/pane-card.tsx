import type { ReactNode } from 'react';
import { Card } from './card.tsx';
import { StateMessage } from './state-message.tsx';

/** The card that fills a pane inside a margin, whatever it shows, such as an open thread. */
export function PaneCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 p-5">
      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</Card>
    </div>
  );
}

interface PaneMessageProps {
  message: string;
  /** What the user can do about it, such as trying again. */
  action?: { label: string; onClick: () => void } | undefined;
  /** What stands at the top of the card, above the message, such as a way back. */
  top?: ReactNode;
}

/** Why a pane shows nothing, centred in its card, with what to do about it. */
export function PaneMessage({ message, action, top }: PaneMessageProps) {
  return (
    <PaneCard>
      {top !== undefined && <div className="flex flex-none px-4 pt-3 empty:hidden">{top}</div>}
      <StateMessage message={message} action={action} className="flex-1 justify-center px-10" />
    </PaneCard>
  );
}
