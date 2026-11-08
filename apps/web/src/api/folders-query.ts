import { folderListSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

export const foldersQuery = queryOptions({
  queryKey: ['folders'],
  queryFn: ({ signal }) => fetchApi('/folders', folderListSchema, signal),
});
