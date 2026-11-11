import { ChevronDownIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

interface SelectOption {
  value: string;
  /** As the list of the system shows it, and as it is read aloud. */
  label: string;
}

interface SelectProps
  extends Omit<ComponentProps<'select'>, 'value' | 'onChange' | 'children' | 'className'> {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** What shows of the chosen option on screen, in place of its label. */
  children: ReactNode;
}

/**
 * A choice among options, shown as its `children` and a chevron. The system's own select lies
 * invisible over them: it opens its usual list, takes the keyboard and is read aloud as usual. It
 * has no frame of its own: the place it stands shows its focus, as a field line does.
 */
export function Select({ value, onChange, options, children, ...selectProps }: SelectProps) {
  return (
    <span className="relative inline-flex h-7 max-w-full min-w-0 items-center gap-2 text-ink-2 hover:text-ink">
      <span aria-hidden="true" className="flex min-w-0 items-center gap-2.5">
        {children}
      </span>
      <ChevronDownIcon aria-hidden="true" className="icon-16" />
      <select
        {...selectProps}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}
