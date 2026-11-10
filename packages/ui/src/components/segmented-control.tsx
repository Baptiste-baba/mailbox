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
 * A choice between a few options shown side by side. Native radio buttons carry it, so that arrow
 * keys and screen readers work as everywhere else.
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
      className={joinClassNames('inline-flex flex-none rounded-md bg-field p-0.5', className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="grid h-5.5 place-items-center rounded-sm px-2.5 text-caption text-ink-2 touch:h-10 has-checked:bg-surface has-checked:font-semibold has-checked:text-ink has-checked:shadow-card not-has-checked:hover:text-ink has-focus-visible:outline-3 has-focus-visible:outline-ring"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {/* The bold copy reserves the width of the selected state, so that no option ever moves. */}
          <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-semibold">
            {option.label}
          </span>
          <span className="col-start-1 row-start-1">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
