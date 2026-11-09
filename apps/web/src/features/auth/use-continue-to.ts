import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { forgetAuthStatus } from '../../api/auth-status-query.ts';

/**
 * Leaves an authentication screen for `href`, once the status may have changed: it is asked again
 * on the way, and the pages send wherever it now leads (the app, setup, the new authenticator app).
 */
export function useContinueTo(): (href: string) => void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return (href) => {
    forgetAuthStatus(queryClient);
    void navigate({ href });
  };
}
