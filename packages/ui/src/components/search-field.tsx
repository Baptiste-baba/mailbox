import { SearchIcon } from 'lucide-react';
import { type ComponentProps, type ReactNode, useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface SearchFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'className'> {
  /** What the field searches, read aloud, such as "Rechercher dans la réception". */
  label: string;
  /** Controls at the end of the field, such as a keyboard shortcut. */
  trailing?: ReactNode;
  className?: string;
}

/**
 * A search field: a magnifier, the input and optional controls, in one filled well. Marked
 * `aria-disabled` and read-only, it keeps its look but takes nothing.
 */
export function SearchField({
  label,
  trailing,
  className,
  id,
  enterKeyHint = 'search',
  ...inputProps
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div
      className={joinClassNames(
        'flex h-11 items-center gap-2.5 rounded-md bg-field pr-2 pl-3.5 text-ink-2',
        'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ring',
        'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-55 has-[input[aria-disabled=true]]:cursor-not-allowed',
        className,
      )}
    >
      {/* The magnifier is part of the label, so that clicking it puts the cursor in the field. */}
      <label htmlFor={inputId} className="grid flex-none place-items-center">
        <SearchIcon className="icon-18" />
        <span className="sr-only">{label}</span>
      </label>
      <input
        id={inputId}
        type="search"
        enterKeyHint={enterKeyHint}
        // The browser's own clear button cannot follow the design: Escape clears the field instead.
        className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-2 disabled:cursor-not-allowed touch:text-body [&::-webkit-search-cancel-button]:appearance-none"
        {...inputProps}
      />
      {trailing}
    </div>
  );
}
