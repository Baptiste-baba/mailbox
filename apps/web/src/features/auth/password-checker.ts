import { queryOptions } from '@tanstack/react-query';
import type { Score } from '@zxcvbn-ts/core';

export type PasswordScore = Score;

/** The top of the scale: "excellente". */
export const MAX_PASSWORD_SCORE: PasswordScore = 4;
export type PasswordChecker = (password: string, userInputs: string[]) => PasswordScore;

// Several hundred kilobytes of dictionaries: loaded on the setup screen only, never with the app.
async function loadPasswordChecker(): Promise<PasswordChecker> {
  const [{ ZxcvbnFactory }, common, french] = await Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-common'),
    import('@zxcvbn-ts/language-fr'),
  ]);
  const zxcvbn = new ZxcvbnFactory({
    dictionary: { ...common.dictionary, ...french.dictionary },
    graphs: common.adjacencyGraphs,
  });
  return (password, userInputs) => zxcvbn.check(password, userInputs).score;
}

/**
 * Rates how hard a password is to guess, from 0 to 4: common passwords, words, names, dates,
 * keyboard walks and the user's own name all count against it.
 */
export const passwordCheckerQuery = queryOptions({
  queryKey: ['password-checker'],
  queryFn: loadPasswordChecker,
  staleTime: Number.POSITIVE_INFINITY,
});
