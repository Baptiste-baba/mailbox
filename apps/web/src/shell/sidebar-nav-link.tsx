import { NavItem } from '@mailbox/ui';
import { createLink } from '@tanstack/react-router';

/** A navigation item that is a router link: active when its destination is the current page. */
export const SidebarNavLink = createLink(NavItem);
