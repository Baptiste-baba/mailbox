import { Outlet } from '@tanstack/react-router';
import { useFollowRefusedSession } from '../features/auth/index.ts';

/** Every page: wherever a request meets a refused session, the app follows it. */
export function RootLayout() {
  useFollowRefusedSession();
  return <Outlet />;
}
