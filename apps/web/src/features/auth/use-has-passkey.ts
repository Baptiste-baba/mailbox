import { useQuery } from '@tanstack/react-query';
import { passkeysQuery } from '../../api/passkeys-query.ts';

/** Whether the account has a passkey, to confirm the identity with. */
export function useHasPasskey(): boolean {
  return useQuery({ ...passkeysQuery, select: (list) => list.passkeys.length > 0 }).data ?? false;
}
