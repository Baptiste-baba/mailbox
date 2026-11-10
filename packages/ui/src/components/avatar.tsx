import { initialsOf } from '../initials-of.ts';
import { joinClassNames } from '../join-class-names.ts';

type AvatarTone = 'neutral' | 'accent';

const toneClassNames: Record<AvatarTone, string> = {
  neutral: 'bg-tint text-tint-ink',
  accent: 'bg-primary text-on-primary',
};

type AvatarSize = 'md' | 'sm';

const sizeClassNames: Record<AvatarSize, string> = {
  md: 'size-10 text-small',
  sm: 'size-9 text-caption',
};

interface AvatarProps {
  name: string;
  /** `accent` stands for the user themself. */
  tone?: AvatarTone;
  /** `md` in a list, `sm` in a thread. */
  size?: AvatarSize;
  className?: string;
}

/** A round badge before a person or an organisation, with the initials of its name. */
export function Avatar({ name, tone = 'neutral', size = 'md', className }: AvatarProps) {
  return (
    // Hidden from screen readers: the name it stands for is always written next to it.
    <span
      aria-hidden="true"
      className={joinClassNames(
        'grid flex-none place-items-center rounded-full font-semibold',
        sizeClassNames[size],
        toneClassNames[tone],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
