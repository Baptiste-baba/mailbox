import { getRouteApi } from '@tanstack/react-router';
import { BackButton } from '../../back-button.tsx';
import { useLayout } from '../../shell/layout.ts';
import { useGoBack } from '../../use-go-back.ts';

const threadRoute = getRouteApi('/_shell/$view/$id');

/**
 * On a phone, where the open thread takes the whole screen, the way back to the list it was chosen
 * from. Elsewhere the list stays beside the thread, and there is nothing to go back to.
 */
export function ThreadBackButton() {
  const layout = useLayout();
  const navigate = threadRoute.useNavigate();
  const backToList = useGoBack(() => navigate({ to: '/$view', params: true, search: true }));
  return layout === 'phone' ? <BackButton onBack={backToList} /> : null;
}
