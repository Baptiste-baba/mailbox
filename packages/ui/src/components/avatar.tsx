import type { ReactNode } from 'react';
import { initialsOf } from '../initials-of.ts';
import { joinClassNames } from '../join-class-names.ts';

type AvatarTone = 'neutral' | 'accent' | 'danger';

const toneClassNames: Record<AvatarTone, string> = {
  neutral: 'bg-avatar text-ink2',
  accent: 'bg-klein text-onk',
  danger: 'bg-vermbg text-verm',
};

type AvatarProps = {
  tone?: AvatarTone;
  className?: string;
} & ({ name: string } | { icon: ReactNode });

/** A round badge before a person or an organisation, with the initials of its name or an icon. */
export function Avatar({ tone = 'neutral', className, ...content }: AvatarProps) {
  return (
    // Hidden from screen readers: the name it stands for is always written next to it.
    <span
      aria-hidden="true"
      className={joinClassNames(
        'grid size-7.5 flex-none place-items-center rounded-full text-micro font-semibold [&>svg]:icon-15',
        toneClassNames[tone],
        className,
      )}
    >
      {'name' in content ? initialsOf(content.name) : content.icon}
    </span>
  );
}
