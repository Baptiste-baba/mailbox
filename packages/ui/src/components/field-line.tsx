import type { ReactNode } from 'react';

interface FieldLineProps {
  label: string;
  /** Id of the control the label names: clicking the label puts the keyboard in it. */
  htmlFor: string;
  /** Controls at the end of the line, such as buttons adding more lines. */
  trailing?: ReactNode;
  children: ReactNode;
}

/**
 * One field of a form laid flat on a line: its label, then its control, all lined up with the
 * fields above and below. The line turns to the focus colour while its control has the keyboard.
 */
export function FieldLine({ label, htmlFor, trailing, children }: FieldLineProps) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 focus-within:border-ring focus-within:shadow-[inset_0_-1px_0_var(--color-ring)]">
      <label
        htmlFor={htmlFor}
        className="flex h-7 w-14 flex-none items-center text-small text-ink-2"
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
      {trailing !== undefined && (
        // Buttons taller than the line spill into its padding, so that the line keeps its height.
        <div className="-my-0.5 flex flex-none items-center">{trailing}</div>
      )}
    </div>
  );
}
