import { NavItem } from '@mailbox/ui';
import type { ReactNode } from 'react';
import { fr } from '../i18n/fr.ts';

interface ComingSoonNavItemProps {
  icon: ReactNode;
  label: string;
  trailing?: ReactNode;
}

/** A destination that does not exist yet: shown, but disabled. */
export function ComingSoonNavItem({ icon, label, trailing }: ComingSoonNavItemProps) {
  return (
    <NavItem icon={icon} label={label} trailing={trailing} disabled title={fr.common.comingSoon} />
  );
}
