import { createFileRoute, redirect } from '@tanstack/react-router';
import { authStatusQuery } from '../api/auth-status-query.ts';
import { SetupPage } from '../features/auth/index.ts';

export const Route = createFileRoute('/setup')({
  // Setup happens once: afterwards, the address leads to the app.
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.ensureQueryData(authStatusQuery);
    if (status.state !== 'setupRequired') {
      throw redirect({ to: '/' });
    }
  },
  component: SetupPage,
});
