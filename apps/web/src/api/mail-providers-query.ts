import { mailProviderListSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

/** The mail providers the server has a client for: a mailbox can be added from these only. */
export const mailProvidersQuery = queryOptions({
  queryKey: ['mail-providers'],
  queryFn: ({ signal }) => fetchApi('/mail-providers', mailProviderListSchema, signal),
});
