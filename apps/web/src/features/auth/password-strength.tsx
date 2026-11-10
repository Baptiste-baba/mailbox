import type { PasswordScore } from './password-checker.ts';

const SEGMENTS = [1, 2, 3, 4];

function segmentColor(segment: number, score: PasswordScore, strongEnough: boolean): string {
  // A typed password always fills the first bar: the lowest score still shows something.
  if (segment > Math.max(score, 1)) {
    return 'bg-field';
  }
  return strongEnough ? 'bg-primary' : 'bg-danger';
}

interface PasswordStrengthBarsProps {
  score: PasswordScore;
  strongEnough: boolean;
}

/** Four bars filling up with the score: red while too weak, blue once strong enough. */
export function PasswordStrengthBars({ score, strongEnough }: PasswordStrengthBarsProps) {
  return (
    <div aria-hidden="true" className="-mt-4 flex gap-1">
      {SEGMENTS.map((segment) => (
        <span
          key={segment}
          className={`h-1 flex-1 rounded-full ${segmentColor(segment, score, strongEnough)}`}
        />
      ))}
    </div>
  );
}
