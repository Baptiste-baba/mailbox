import { CheckIcon } from 'lucide-react';
import { joinClassNames } from '../join-class-names.ts';

type StepState = 'done' | 'current' | 'upcoming';

const circleClassNames: Record<StepState, string> = {
  done: 'bg-primary text-on-primary',
  current: 'bg-primary text-on-primary ring-4 ring-halo ring-offset-2 ring-offset-chrome',
  upcoming: 'bg-muted text-on-primary',
};

function stateOf(index: number, current: number): StepState {
  if (index === current) {
    return 'current';
  }
  return index < current ? 'done' : 'upcoming';
}

/**
 * The line through the circles, drawn in two halves on each side of a circle: blue up to the
 * current step, then halfway on to the next one.
 */
function lineClassName(index: number, count: number, current: number): string {
  const reached = index <= current;
  // Each half exists only where there is a circle to reach: an empty one would sit in the column.
  return joinClassNames(
    index === 0
      ? undefined
      : joinClassNames(
          'before:absolute before:top-3.25 before:right-1/2 before:left-0 before:h-0.5',
          reached ? 'before:bg-primary' : 'before:bg-line',
        ),
    index === count - 1
      ? undefined
      : joinClassNames(
          'after:absolute after:top-3.25 after:right-0 after:left-1/2 after:h-0.5',
          reached ? 'after:bg-primary' : 'after:bg-line',
        ),
  );
}

interface StepperProps {
  /** What the steps lead to, such as "Étapes de l'installation": the name of the list. */
  label: string;
  steps: readonly string[];
  /** Index of the step the user stands at. */
  current: number;
}

/**
 * Where the user stands in a sequence of steps: numbered circles on a line, the done ones ticked,
 * the current one ringed. Drawn on the `chrome` background, which the ring leaves a gap of.
 */
export function Stepper({ label, steps, current }: StepperProps) {
  return (
    <ol aria-label={label} className="flex">
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        return (
          <li
            key={step}
            aria-current={state === 'current' ? 'step' : undefined}
            className={joinClassNames(
              'relative flex flex-1 flex-col items-center gap-2.5 text-center text-small',
              lineClassName(index, steps.length, current),
            )}
          >
            {/* Above the line, which runs through its centre. The number only repeats the order of
                the list, read as such: it is hidden from screen readers. */}
            <span
              aria-hidden="true"
              className={joinClassNames(
                'relative z-10 grid size-7 place-items-center rounded-full font-medium [&>svg]:icon-14',
                circleClassNames[state],
              )}
            >
              {state === 'done' ? <CheckIcon /> : index + 1}
            </span>
            <span className={state === 'upcoming' ? 'text-ink-2' : 'text-ink'}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
