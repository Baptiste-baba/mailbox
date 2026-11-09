import { createFileRoute } from '@tanstack/react-router';
import { requireAuthState, SetupPage } from '../features/auth/index.ts';

export const Route = createFileRoute('/setup')({
  // Setup happens once: afterwards, the address leads to the app.
  beforeLoad: async ({ context }) => {
    await requireAuthState(context.queryClient, 'setupRequired', undefined);
  },
  component: SetupPage,
});
