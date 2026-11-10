import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';
import { Kbd } from './kbd.tsx';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'neutralText';
type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

// Hover states reuse the colour tokens.
const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary font-semibold text-on-primary enabled:hover:bg-primary-hover',
  secondary: 'border border-line bg-surface font-medium text-ink enabled:hover:bg-field',
  text: 'font-medium text-link enabled:hover:bg-field',
  neutralText: 'font-medium text-ink enabled:hover:bg-field',
};

const sizeClassNames: Record<ButtonSize, string> = {
  lg: 'h-8.5 rounded-md',
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
  shortcut?: string | undefined;
}

/**
 * A button with a text label, after an optional icon. Its type defaults to `button`, so that it never
 * submits a form by accident.
 */
export function Button({
  variant,
  size = 'md',
  shortcut,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        'inline-flex flex-none items-center justify-center gap-1.75 whitespace-nowrap text-base touch:h-11 [&>svg]:icon-14',
        pressableClassNames,
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
        <Kbd
          surface={variant === 'primary' ? 'accent' : 'plain'}
          aria-hidden="true"
          className="ml-auto"
        >
          {shortcut}
        </Kbd>
      )}
    </button>
  );
}
