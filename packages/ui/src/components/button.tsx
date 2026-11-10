import type { ComponentProps } from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';
import { Kbd } from './kbd.tsx';

type ButtonVariant = 'primary' | 'secondary' | 'text';
type ButtonSize = 'lg' | 'field' | 'md' | 'sm';

// Hover states reuse the colour tokens. The border of `secondary` is drawn within its height, so every
// variant of a size lines up.
const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary available:hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink available:hover:bg-field',
  text: 'text-link available:hover:bg-field',
};

// `field` is as tall as the fields and bars (44 px), for a button that stands among them.
const sizeClassNames: Record<ButtonSize, string> = {
  lg: 'h-12 text-body [&>svg]:icon-18',
  field: 'h-11 text-base [&>svg]:icon-18',
  md: 'h-10 text-base [&>svg]:icon-18',
  sm: 'h-8 text-small [&>svg]:icon-16',
};

const paddingClassNames: Record<ButtonSize, string> = {
  lg: 'px-5',
  field: 'px-4',
  md: 'px-4',
  sm: 'px-3',
};

function paddingClassName(variant: ButtonVariant, size: ButtonSize): string {
  return variant === 'text' ? 'px-2' : paddingClassNames[size];
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
        'inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium touch:min-h-11',
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
