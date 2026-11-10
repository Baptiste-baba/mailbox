import { setupRequestSchema } from '@mailbox/shared';
import { Meter } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import type { PasswordScore } from './password-checker.ts';
import { MIN_PASSWORD_SCORE } from './use-setup-account-form.ts';

const MAX_SCORE: PasswordScore = 4;

function Requirement({ label, met }: { label: string; met: boolean }) {
  return (
    <li className={met ? 'text-success' : 'text-ink-2'}>
      {label}{' '}
      <span className="sr-only">
        ({met ? fr.setup.requirementMet : fr.setup.requirementMissing})
      </span>
    </li>
  );
}

interface PasswordRequirementsProps {
  password: string;
  /** Undefined while nothing is typed, or while the dictionaries load. */
  score: PasswordScore | undefined;
}

/** How hard the new password is to guess, then what it must reach, each turning green once met. */
export function PasswordRequirements({ password, score }: PasswordRequirementsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <Meter
        label={fr.setup.strengthLabel}
        value={score ?? 0}
        max={MAX_SCORE}
        valueText={score === undefined ? undefined : fr.setup.strengthLevels[score]}
      />
      <div className="flex items-baseline justify-between gap-4 text-small">
        <span className="text-ink-2">{fr.setup.requirementsLabel}</span>
        <ul className="flex flex-wrap justify-end gap-x-5 gap-y-1">
          <Requirement
            label={fr.setup.requirementLength}
            met={setupRequestSchema.shape.password.safeParse(password).success}
          />
          <Requirement
            label={fr.setup.requirementStrength}
            met={score !== undefined && score >= MIN_PASSWORD_SCORE}
          />
        </ul>
      </div>
    </div>
  );
}
