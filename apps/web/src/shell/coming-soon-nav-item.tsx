import { Kbd, NavItem } from '@mailbox/ui';
import type { ReactNode } from 'react';
import { comingSoonHint } from '../hint.ts';

interface ComingSoonNavItemProps {
  icon: ReactNode;
  label: string;
  shortcut?: string;
}

/** A destination that does not exist yet: shown, but disabled. */
export function ComingSoonNavItem({ icon, label, shortcut }: ComingSoonNavItemProps) {
  return (
    <NavItem
      icon={icon}
      label={label}
      trailing={shortcut === undefined ? undefined : <Kbd>{shortcut}</Kbd>}
      disabled
      title={comingSoonHint(label, shortcut)}
    />
  );
}
