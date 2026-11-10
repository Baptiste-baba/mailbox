import { fr } from '../../i18n/fr.ts';

function stepClassName(index: number, current: number): string {
  if (index === current) {
    return 'font-semibold text-link';
  }
  return index < current ? 'text-ink' : 'text-ink-2';
}

/** Where the user is among the steps of the setup: a real sequence, hence the numbers. */
export function SetupProgress({ current }: { current: number }) {
  return (
    <ol aria-label={fr.setup.progressLabel} className="flex flex-wrap gap-x-4 gap-y-1 text-caption">
      {fr.setup.steps.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? 'step' : undefined}
          className={stepClassName(index, current)}
        >
          {index + 1}. {step}
        </li>
      ))}
    </ol>
  );
}
