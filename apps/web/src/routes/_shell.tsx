import { createFileRoute } from '@tanstack/react-router';
import { requireAuthState } from '../features/auth/index.ts';
import { Shell } from '../shell/shell.tsx';

export const Route = createFileRoute('/_shell')({
  // The app is for the signed-in user only; anyone else goes to setup, sign-in or the new
  // authenticator app first, and back after.
  beforeLoad: async ({ context, location }) => {
    await requireAuthState(context.queryClient, 'signedIn', location.href);
  },
  component: Shell,
});
