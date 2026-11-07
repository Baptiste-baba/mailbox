import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { Kbd } from './kbd.tsx';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'neutralText' | 'gradient';
type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

// The design handoff has no hover, press or disabled state: these reuse its own tokens.
const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-klein font-semibold text-onk shadow-press enabled:hover:bg-kleintx',
  secondary: 'bg-paper font-medium text-ink shadow-lift enabled:hover:bg-mist2',
  text: 'font-medium text-klein enabled:hover:bg-mist2',
  neutralText: 'font-medium text-ink enabled:hover:bg-mist2',
  gradient:
    'bg-linear-to-r/srgb from-g1 to-g-fill-end font-medium text-onk shadow-glow enabled:hover:from-kleintx',
};

const sizeClassNames: Record<ButtonSize, string> = {
  lg: 'h-8.5 rounded-lg',
  md: 'h-7 rounded-md',
  sm: 'h-6.5 rounded-md',
  xs: 'h-5.5 rounded-md',
};

function paddingClassName(variant: ButtonVariant, size: ButtonSize): string {
  if (variant === 'text' || variant === 'neutralText') {
    return 'px-1.5';
  }
  return size === 'lg' ? 'px-4' : 'px-3';
}

interface ButtonProps extends ComponentProps<'button'> {
  variant: ButtonVariant;
  size?: ButtonSize;
  /** Keyboard shortcut shown at the end of the button, such as ⌘↵. */
  shortcut?: string;
}

/** A button with a text label. Its type defaults to `button`, so that it never submits a form by accident. */
export function Button({
  variant,
  size = 'md',
  shortcut,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const onAccent = variant === 'primary' || variant === 'gradient';
  return (
    <button
      type={type}
      className={joinClassNames(
        'inline-flex flex-none items-center justify-center gap-1.75 whitespace-nowrap text-base touch:h-11 disabled:cursor-not-allowed disabled:opacity-55 motion-safe:enabled:active:scale-98',
        variantClassNames[variant],
        sizeClassNames[size],
        paddingClassName(variant, size),
        className,
      )}
      {...props}
    >
      {children}
      {shortcut !== undefined && (
        // Shown for sighted users only: read aloud, it would be appended to the button's name.
        <Kbd surface={onAccent ? 'accent' : 'plain'} aria-hidden="true" className="ml-auto">
          {shortcut}
        </Kbd>
      )}
    </button>
  );
}
