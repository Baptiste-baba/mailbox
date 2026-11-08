import { mailboxListSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

export const mailboxesQuery = queryOptions({
  queryKey: ['mailboxes'],
  queryFn: ({ signal }) => fetchApi('/mailboxes', mailboxListSchema, signal),
});
