import { useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
}

type SegmentedControlVariant = 'pill' | 'tabs';

// `pill`: options on a grey track, the chosen one raised. `tabs`: options sharing the whole width
// above a line, the chosen one underlined in blue.
const groupClassNames: Record<SegmentedControlVariant, string> = {
  pill: 'inline-flex flex-none rounded-md bg-field p-0.5',
  tabs: 'flex border-b border-line',
};

const optionClassNames: Record<SegmentedControlVariant, string> = {
  pill: 'h-5.5 rounded-sm px-2.5 text-caption text-ink-2 touch:h-10 has-checked:bg-surface has-checked:font-semibold has-checked:text-ink has-checked:shadow-card not-has-checked:hover:text-ink has-focus-visible:outline-3 has-focus-visible:outline-ring',
  tabs: '-mb-px flex-1 border-b-2 border-transparent py-3 text-base leading-none font-medium text-ink-2 touch:min-h-11 has-checked:border-link has-checked:text-link not-has-checked:hover:text-ink has-focus-visible:outline-2 has-focus-visible:outline-ring',
};

interface SegmentedControlProps<Value extends string> {
  /** Name of the choice, read aloud before its options. */
  label: string;
  options: readonly SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  variant?: SegmentedControlVariant;
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
  variant = 'pill',
  className,
}: SegmentedControlProps<Value>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={joinClassNames(groupClassNames[variant], className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={joinClassNames('grid place-items-center', optionClassNames[variant])}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {/* The bold copy reserves the width of the selected pill, so that no option ever moves. */}
          {variant === 'pill' && (
            <span aria-hidden="true" className="invisible col-start-1 row-start-1 font-semibold">
              {option.label}
            </span>
          )}
          <span className="col-start-1 row-start-1">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
