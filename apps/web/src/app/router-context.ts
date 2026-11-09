import type { QueryClient } from '@tanstack/react-query';

/** What every route receives: the routes ask the cache before showing a page. */
export interface RouterContext {
  queryClient: QueryClient;
}
