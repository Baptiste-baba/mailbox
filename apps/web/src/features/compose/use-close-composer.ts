import { getRouteApi, useCanGoBack, useRouter } from '@tanstack/react-router';

const composeRoute = getRouteApi('/_shell/$view/new');

/**
 * Closes the new mail, back to where the user was before opening it, such as the mail they were
 * reading. Opened from its address alone, it closes on the list.
 */
export function useCloseComposer(): () => void {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = composeRoute.useNavigate();
  return () => {
    if (canGoBack) {
      router.history.back();
    } else {
      navigate({ to: '/$view', params: true, search: true });
    }
  };
}
