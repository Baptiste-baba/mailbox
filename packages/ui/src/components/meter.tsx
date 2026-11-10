import { joinClassNames } from '../join-class-names.ts';

interface MeterProps {
  /** What is measured, such as "Robustesse du mot de passe": read by screen readers. */
  label: string;
  value: number;
  max: number;
  /** The value in words, such as "bonne", read in place of the number. */
  valueText?: string | undefined;
  className?: string;
}

/** A measure on a scale: the browser's own meter, drawn as a bar filling up in green. */
export function Meter({ label, value, max, valueText, className }: MeterProps) {
  return (
    <meter
      aria-label={label}
      aria-valuetext={valueText}
      min={0}
      max={max}
      value={value}
      className={joinClassNames(
        'block h-1.5 w-full appearance-none overflow-hidden rounded-full bg-field',
        // Chrome and Safari paint their own gradients: removed, so that the colours show.
        '[&::-webkit-meter-bar]:h-1.5 [&::-webkit-meter-bar]:rounded-full [&::-webkit-meter-bar]:border-0 [&::-webkit-meter-bar]:bg-field [&::-webkit-meter-bar]:bg-none',
        '[&::-webkit-meter-optimum-value]:rounded-full [&::-webkit-meter-optimum-value]:bg-success [&::-webkit-meter-optimum-value]:bg-none',
        '[&::-moz-meter-bar]:rounded-full [&::-moz-meter-bar]:bg-success',
        className,
      )}
    />
  );
}
