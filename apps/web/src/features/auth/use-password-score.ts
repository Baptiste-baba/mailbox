import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fr } from '../../i18n/fr.ts';
import { type PasswordScore, passwordCheckerQuery } from './password-checker.ts';

/**
 * How hard the password is to guess, from 0 to 4; undefined while nothing is typed, or while the
 * dictionaries load. Built from the username or the product name, it rates lower.
 */
export function usePasswordScore(password: string, username: string): PasswordScore | undefined {
  const checker = useQuery(passwordCheckerQuery).data;
  return useMemo(
    () =>
      checker === undefined || password === ''
        ? undefined
        : checker(password, [username, fr.auth.productName]),
    [checker, password, username],
  );
}
