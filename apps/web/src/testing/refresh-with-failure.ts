import type { QueryClient } from '@tanstack/react-query';
import { expect } from 'vitest';

/** Refreshes every query, waits until they have failed, then lets the screen render that failure. */
export async function refreshAndFail(queryClient: QueryClient): Promise<void> {
  await queryClient.refetchQueries();
  await expect
    .poll(() =>
      queryClient
        .getQueryCache()
        .getAll()
        .some((query) => query.state.status === 'error'),
    )
    .toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 100));
}
