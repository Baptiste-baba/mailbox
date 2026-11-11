import { MinusIcon, PlusIcon } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { IconButton } from './icon-button.tsx';

interface NumberStepperProps {
  /** What the number is, read aloud, such as "Taille". */
  label: string;
  value: number;
  min: number;
  max: number;
  /** Called with each new number, already kept between `min` and `max`. */
  onChange: (value: number) => void;
  /** Called once a typed number is confirmed with Enter, such as to give the keyboard back. */
  onSubmit: () => void;
  decreaseLabel: string;
  increaseLabel: string;
}

/** The number being typed, and how typing, stepping and confirming change the value. */
function useNumberEntry({ value, min, max, onChange, onSubmit }: NumberStepperProps) {
  const [typed, setTyped] = useState<string>();
  const keep = (number: number) => onChange(Math.min(max, Math.max(min, number)));
  const step = (by: number) => {
    setTyped(undefined);
    keep(value + by);
  };
  const confirm = () => {
    const number = typed === undefined ? Number.NaN : Number.parseInt(typed, 10);
    setTyped(undefined);
    if (Number.isFinite(number)) {
      keep(number);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirm();
      onSubmit();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      step(event.key === 'ArrowUp' ? 1 : -1);
    }
  };
  const type = (text: string) => setTyped(text.replace(/\D/g, ''));
  return { text: typed ?? String(value), type, step, confirm, onKeyDown };
}

/**
 * A whole number, typed, or stepped by one with − and +, or the up and down arrows, and kept
 * between `min` and `max`. What is typed counts once confirmed with Enter or on leaving the field.
 */
export function NumberStepper(props: NumberStepperProps) {
  const { label, value, min, max, decreaseLabel, increaseLabel } = props;
  const entry = useNumberEntry(props);
  return (
    <span className="inline-flex flex-none items-center">
      <IconButton
        label={decreaseLabel}
        size="sm"
        onClick={() => entry.step(-1)}
        disabled={value <= min}
      >
        <MinusIcon />
      </IconButton>
      <input
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        inputMode="numeric"
        value={entry.text}
        onChange={(event) => entry.type(event.target.value)}
        onFocus={(event) => event.target.select()}
        onBlur={entry.confirm}
        onKeyDown={entry.onKeyDown}
        className="h-8 w-10 rounded-sm bg-field text-center text-base text-ink tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-ring"
      />
      <IconButton
        label={increaseLabel}
        size="sm"
        onClick={() => entry.step(1)}
        disabled={value >= max}
      >
        <PlusIcon />
      </IconButton>
    </span>
  );
}
