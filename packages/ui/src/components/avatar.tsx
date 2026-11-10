import type { ReactNode } from 'react';
import { initialsOf } from '../initials-of.ts';
import { joinClassNames } from '../join-class-names.ts';

type AvatarTone = 'neutral' | 'accent' | 'danger';

const toneClassNames: Record<AvatarTone, string> = {
  neutral: 'bg-tint text-tint-ink',
  accent: 'bg-primary text-on-primary',
  danger: 'bg-danger-tint text-danger',
};

type AvatarSize = 'md' | 'sm';

const sizeClassNames: Record<AvatarSize, string> = {
  md: 'size-10 text-small',
  sm: 'size-9 text-caption',
};

type AvatarProps = {
  tone?: AvatarTone;
  /** `md` in a list, `sm` in a thread. */
  size?: AvatarSize;
  className?: string;
} & ({ name: string } | { icon: ReactNode });

/** A round badge before a person or an organisation, with the initials of its name or an icon. */
export function Avatar({ tone = 'neutral', size = 'md', className, ...content }: AvatarProps) {
  return (
    // Hidden from screen readers: the name it stands for is always written next to it.
    <span
      aria-hidden="true"
      className={joinClassNames(
        'grid flex-none place-items-center rounded-full font-semibold [&>svg]:icon-18',
        sizeClassNames[size],
        toneClassNames[tone],
        className,
      )}
    >
      {'name' in content ? initialsOf(content.name) : content.icon}
    </span>
  );
}
