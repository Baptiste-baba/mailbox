import { createFileRoute } from '@tanstack/react-router';
import {
  authenticatorReplacementSearchSchema,
  ReplaceAuthenticatorPage,
  requireAuthState,
} from '../features/auth/index.ts';

export const Route = createFileRoute('/new-authenticator')({
  validateSearch: authenticatorReplacementSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const status = await requireAuthState(
      context.queryClient,
      'authenticatorReplacementRequired',
      search.redirect,
    );
    return { recoveryCodesLeft: status.recoveryCodesLeft };
  },
  component: ReplaceAuthenticatorPage,
});
