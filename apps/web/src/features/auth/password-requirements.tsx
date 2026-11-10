import { MIN_PASSWORD_LENGTH } from '@mailbox/shared';
import { Meter } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';
import { MAX_PASSWORD_SCORE, type PasswordScore } from './password-checker.ts';
import { isLongEnough, isStrongEnough } from './use-setup-account-form.ts';

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
        max={MAX_PASSWORD_SCORE}
        valueText={score === undefined ? undefined : fr.setup.strengthLevels[score]}
      />
      <div className="flex items-baseline justify-between gap-4 text-small">
        <span className="text-ink-2">{fr.setup.requirementsLabel}</span>
        <ul className="flex flex-wrap justify-end gap-x-5 gap-y-1">
          <Requirement
            label={fr.setup.requirementLength(MIN_PASSWORD_LENGTH)}
            met={isLongEnough(password)}
          />
          <Requirement label={fr.setup.requirementStrength} met={isStrongEnough(score)} />
        </ul>
      </div>
    </div>
  );
}
