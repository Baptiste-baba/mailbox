import { Outlet } from '@tanstack/react-router';

/** Frame of the app around every screen: the sidebar, then the screen itself. */
export function Shell() {
  return <Outlet />;
}
