import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render } from 'vitest-browser-react';
import '../styles.css';
import { routeTree } from '../routeTree.gen.ts';

export type AppScreen = Awaited<ReturnType<typeof renderApp>>['screen'];

/** Renders the whole app at `path`, with its real routes and a cache of its own. */
export async function renderApp(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { screen, router, queryClient };
}
