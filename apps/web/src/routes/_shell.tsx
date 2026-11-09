import { createFileRoute, redirect } from '@tanstack/react-router';
import { authStatusQuery } from '../api/auth-status-query.ts';
import { Shell } from '../shell/shell.tsx';

export const Route = createFileRoute('/_shell')({
  // The app is for the signed-in user only; anyone else goes to setup or sign-in, and back after.
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.ensureQueryData(authStatusQuery);
    if (status.state === 'setupRequired') {
      throw redirect({ to: '/setup' });
    }
    if (status.state === 'signedOut') {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: Shell,
});
