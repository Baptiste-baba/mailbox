import { type ComponentProps, type ReactNode, useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

export interface TextFieldProps
  extends Omit<ComponentProps<'input'>, 'className' | 'aria-invalid' | 'aria-describedby'> {
  /** Shown inside the field, above what is typed, and its accessible name. */
  label: string;
  /** Help under the field, such as what to type in it; the error takes its place when there is one. */
  hint?: string | undefined;
  /** Why the value is refused: shown in red under the field, and read aloud with it. */
  error?: string | undefined;
  /** A control at the end of the field, such as a button showing a password. */
  trailing?: ReactNode;
  className?: string;
}

/** A filled text field with its label inside, and an optional hint or error under it. */
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
      <div
        className={joinClassNames(
          'relative rounded-md bg-field',
          'has-[input:focus]:bg-surface has-[input:focus]:outline-2 not-has-aria-invalid:has-[input:focus]:outline-ring',
          'has-aria-invalid:outline-2 has-aria-invalid:outline-danger',
          'has-disabled:cursor-not-allowed has-disabled:opacity-55',
        )}
      >
        {/* The input fills the whole field under its label, so that a click anywhere focuses it. */}
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute top-2.25 left-4 text-caption text-ink-2"
        >
          {label}
        </label>
        <input
          id={inputId}
          aria-invalid={error !== undefined}
          aria-describedby={message === undefined ? undefined : messageId}
          className={joinClassNames(
            'h-14.5 w-full rounded-md bg-transparent pt-6.75 pb-1.75 pl-4 text-body text-ink outline-none placeholder:text-ink-2 disabled:cursor-not-allowed',
            trailing === undefined ? 'pr-4' : 'pr-14',
          )}
          {...inputProps}
        />
        {trailing !== undefined && (
          <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>
        )}
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
