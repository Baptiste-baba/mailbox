import { createRootRoute, Outlet } from '@tanstack/react-router';
import { MessageScreen } from '../app/message-screen.tsx';
import { fr } from '../i18n/fr.ts';

export const Route = createRootRoute({
  component: Outlet,
  // Never shows the error itself: its message may contain mail data.
  errorComponent: () => (
    <MessageScreen title={fr.unexpectedError.title} description={fr.unexpectedError.description} />
  ),
  notFoundComponent: () => (
    <MessageScreen title={fr.notFound.title} description={fr.notFound.description} />
  ),
});
