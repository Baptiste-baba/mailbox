import { getRouteApi } from '@tanstack/react-router';
import { useGoBack } from '../../use-go-back.ts';

const composeRoute = getRouteApi('/_shell/$view/new');

/**
 * Closes the new mail, back to where the user was before opening it, such as the mail they were
 * reading. Opened from its address alone, it closes on the list.
 */
export function useCloseComposer(): () => void {
  const navigate = composeRoute.useNavigate();
  return useGoBack(() => navigate({ to: '/$view', params: true, search: true }));
}
