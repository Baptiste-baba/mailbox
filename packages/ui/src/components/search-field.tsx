import { SearchIcon } from 'lucide-react';
import { type ComponentProps, type ReactNode, useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface SearchFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'className'> {
  /** What the field searches, read aloud, such as "Rechercher dans la réception". */
  label: string;
  /** Controls at the end of the field, such as a toggle chip or a keyboard shortcut. */
  trailing?: ReactNode;
  className?: string;
}

/** A search field: a magnifier, the input and optional controls, in one rounded well. */
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
        'flex h-7.5 items-center gap-2 rounded-md bg-mist2 pr-1.5 pl-2.25 text-ink3 touch:h-11 has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-ring has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-55',
        className,
      )}
    >
      {/* The magnifier is part of the label, so that clicking it puts the cursor in the field. */}
      <label htmlFor={inputId} className="grid flex-none place-items-center">
        <SearchIcon className="icon-14" />
        <span className="sr-only">{label}</span>
      </label>
      <input
        id={inputId}
        type="search"
        enterKeyHint={enterKeyHint}
        // The browser's own clear button cannot follow the design: Escape clears the field instead.
        className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink3 disabled:cursor-not-allowed touch:text-touch [&::-webkit-search-cancel-button]:appearance-none"
        {...inputProps}
      />
      {trailing}
    </div>
  );
}
