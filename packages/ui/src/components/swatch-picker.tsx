import { useId } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { type SwatchColor, swatchColorClassNames } from './swatch.tsx';

interface SwatchPickerOption {
  color: SwatchColor;
  /** Name of the colour: shown when it is the chosen one, and read aloud. */
  label: string;
}

interface SwatchPickerProps {
  /** Shown inside the field, above the name of the chosen colour, and its accessible name. */
  label: string;
  options: readonly SwatchPickerOption[];
  value: SwatchColor;
  onChange: (color: SwatchColor) => void;
  className?: string;
}

/**
 * The choice of a palette colour, in the shape of a text field: its label and the name of the
 * chosen colour on the left, one round swatch per colour on the right. Native radio buttons carry
 * it, so that arrow keys and screen readers work as everywhere else.
 */
export function SwatchPicker({ label, options, value, onChange, className }: SwatchPickerProps) {
  const name = useId();
  const labelId = useId();
  const chosen = options.find((option) => option.color === value);
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={joinClassNames(
        'flex h-14.5 items-center justify-between gap-4 rounded-md bg-field pr-3 pl-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span id={labelId} className="text-caption text-ink-2">
          {label}
        </span>
        {/* The checked radio button already says it to screen readers. */}
        <span aria-hidden="true" className="truncate text-body text-ink">
          {chosen?.label}
        </span>
      </div>
      <div className="flex flex-none items-center">
        {options.map((option) => (
          <label
            key={option.color}
            title={option.label}
            className="grid size-8 place-items-center rounded-full touch:size-11 has-focus-visible:outline-2 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name={name}
              value={option.color}
              checked={option.color === value}
              onChange={() => onChange(option.color)}
              aria-label={option.label}
              className="peer sr-only"
            />
            <span
              className={joinClassNames(
                'block size-5 rounded-full outline-offset-2 outline-ink peer-checked:outline-2',
                swatchColorClassNames[option.color],
              )}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
