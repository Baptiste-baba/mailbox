import { useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string> {
  /** Name of the choice, read aloud before its options. */
  label: string;
  options: readonly SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}

/**
 * A choice between a few options shown as tabs across the whole width, above a line, the chosen one
 * underlined in blue. Native radio buttons carry it, so that arrow keys and screen readers work as
 * everywhere else.
 */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<Value>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={joinClassNames('flex border-b border-line', className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="-mb-px grid flex-1 place-items-center border-b-2 border-transparent py-3 text-base leading-none font-medium text-ink-2 touch:min-h-11 has-checked:border-link has-checked:text-link not-has-checked:hover:text-ink has-focus-visible:outline-2 has-focus-visible:outline-ring"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
