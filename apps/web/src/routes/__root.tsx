import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { LoadingScreen } from '../app/loading-screen.tsx';
import { MessageScreen } from '../app/message-screen.tsx';
import { RootError } from '../app/root-error.tsx';
import type { RouterContext } from '../app/router-context.ts';
import { fr } from '../i18n/fr.ts';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
  pendingComponent: LoadingScreen,
  errorComponent: RootError,
  notFoundComponent: () => (
    <MessageScreen title={fr.notFound.title} description={fr.notFound.description} />
  ),
});
