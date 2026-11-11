import { passkeyListSchema } from '@mailbox/shared';
import { queryOptions } from '@tanstack/react-query';
import { fetchApi } from './fetch-api.ts';

/** The passkeys of the account, for the security settings. */
export const passkeysQuery = queryOptions({
  queryKey: ['auth', 'passkeys'],
  queryFn: ({ signal }) => fetchApi('/auth/passkeys', passkeyListSchema, signal),
});
