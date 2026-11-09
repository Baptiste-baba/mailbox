import { createFileRoute } from '@tanstack/react-router';
import { LoginPage, loginSearchSchema, requireAuthState } from '../features/auth/index.ts';

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    await requireAuthState(context.queryClient, 'signedOut', search.redirect);
  },
  component: LoginPage,
});
