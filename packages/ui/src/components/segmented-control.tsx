import { useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';

interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
}

type SegmentedControlVariant = 'tabs' | 'pill';

// `pill` floats over a list as a bubble, the chosen option filled in blue.
const variantClassNames: Record<SegmentedControlVariant, { group: string; option: string }> = {
  tabs: {
    group: 'flex border-b border-line',
    option:
      '-mb-px grid flex-1 place-items-center border-b-2 border-transparent py-3 text-base leading-none font-medium text-ink-2 touch:min-h-11 has-checked:border-link has-checked:text-link not-has-checked:hover:text-ink',
  },
  pill: {
    group: 'inline-flex gap-0.5 rounded-full border border-line bg-surface p-1 shadow-bubble',
    option:
      'grid h-8.5 place-items-center rounded-full px-3.5 text-small leading-none font-medium text-ink-2 has-checked:bg-primary has-checked:text-on-primary not-has-checked:hover:text-ink',
  },
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
 * A choice between a few options: tabs across the whole width, above a line, the chosen one
 * underlined in blue, or a floating pill. Native radio buttons carry it, so that arrow keys and
 * screen readers work as everywhere else.
 */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
  variant = 'tabs',
  className,
}: SegmentedControlProps<Value>) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={joinClassNames(variantClassNames[variant].group, className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={joinClassNames(
            variantClassNames[variant].option,
            'has-focus-visible:outline-2 has-focus-visible:outline-ring',
          )}
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
