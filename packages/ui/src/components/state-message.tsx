import { joinClassNames } from '../join-class-names.ts';
import { Button } from './button.tsx';

interface StateMessageProps {
  message: string;
  /** What the user can do about it, such as trying again. */
  action?: { label: string; onClick: () => void } | undefined;
  /** `block` stands in for a whole area; `inline` fits in a line, such as the end of a list. */
  layout?: 'block' | 'inline';
  className?: string;
}

/** Why an area shows nothing, and what to do about it. */
export function StateMessage({ message, action, layout = 'block', className }: StateMessageProps) {
  const block = layout === 'block';
  return (
    <div
      className={joinClassNames(
        block
          ? 'flex flex-col items-center gap-3 text-center text-ink-2'
          : 'flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-2',
        className,
      )}
    >
      <p className={block ? 'max-w-sm' : undefined}>{message}</p>
      {action !== undefined && (
        <Button
          variant={block ? 'secondary' : 'text'}
          size={block ? 'md' : 'sm'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
