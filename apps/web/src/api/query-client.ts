import { QueryClient } from '@tanstack/react-query';
import { shouldRetry } from './should-retry.ts';

/** The single cache of server data for the whole app. */
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetry } },
});
