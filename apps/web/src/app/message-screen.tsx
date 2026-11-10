import { Button } from '@mailbox/ui';

interface MessageScreenProps {
  title: string;
  description: string;
  /** What the user can do about it, such as trying again. */
  action?: { label: string; onClick: () => void };
}

/** Full-page message for the states where no screen can be shown. */
export function MessageScreen({ title, description, action }: MessageScreenProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-chrome p-6">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <h1 className="text-subject font-semibold text-heading">{title}</h1>
        <p className="text-ink-2">{description}</p>
        {action !== undefined && (
          <Button variant="secondary" onClick={action.onClick} className="mt-3">
            {action.label}
          </Button>
        )}
      </div>
    </main>
  );
}
