import { useMatch, useNavigate } from '@tanstack/react-router';

/**
 * Opens the new mail in the pane of the mail view on screen, beside the same list. Outside a mail
 * view (the settings, once they exist), it opens beside the inbox.
 */
export function useOpenComposer(): () => void {
  const navigate = useNavigate();
  const mailView = useMatch({ from: '/_shell/$view', shouldThrow: false });
  return () =>
    navigate({
      to: '/$view/new',
      params: { view: mailView?.params.view ?? 'inbox' },
      search: mailView?.search ?? {},
    });
}
