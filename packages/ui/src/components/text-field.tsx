import { type ComponentProps, type ReactNode, useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

export interface TextFieldProps
  extends Omit<ComponentProps<'input'>, 'className' | 'aria-invalid' | 'aria-describedby'> {
  /** Shown above the field, and its accessible name. */
  label: string;
  /** Help under the field, such as what to type in it; the error takes its place when there is one. */
  hint?: string | undefined;
  /** Why the value is refused: shown in red under the field, and read aloud with it. */
  error?: string | undefined;
  /** Controls at the end of the field, such as a button showing a password. */
  trailing?: ReactNode;
  className?: string;
}

/** A labelled text field, with an optional hint or error under it. */
export function TextField({
  label,
  hint,
  error,
  trailing,
  className,
  id,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;
  return (
    <div className={joinClassNames('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="text-caption font-semibold text-ink-2">
        {label}
      </label>
      <div className="flex h-7.5 items-center gap-2 rounded-md bg-field pr-1 pl-2.25 touch:h-11 has-aria-invalid:outline-1 has-aria-invalid:outline-danger has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-ring has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-55">
        <input
          id={inputId}
          aria-invalid={error !== undefined}
          aria-describedby={message === undefined ? undefined : messageId}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 disabled:cursor-not-allowed touch:text-body"
          {...inputProps}
        />
        {trailing}
      </div>
      {message !== undefined && (
        <p
          id={messageId}
          className={joinClassNames(
            'text-caption',
            error === undefined ? 'text-ink-2' : 'text-danger',
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
