import { createFileRoute, redirect } from '@tanstack/react-router';
import { authStatusQuery } from '../api/auth-status-query.ts';
import { LoginPage, loginSearchSchema } from '../features/auth/index.ts';

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const status = await context.queryClient.ensureQueryData(authStatusQuery);
    if (status.state === 'setupRequired') {
      throw redirect({ to: '/setup' });
    }
    if (status.state === 'signedIn') {
      throw redirect({ href: search.redirect ?? '/' });
    }
  },
  component: LoginPage,
});
