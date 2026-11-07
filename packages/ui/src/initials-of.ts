const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const startsWithLetterOrDigit = /^[\p{L}\p{N}]/u;

// Whole graphemes, so that an accent written as a separate character stays on its letter.
function firstLetterOf(word: string): string | undefined {
  for (const { segment } of graphemes.segment(word)) {
    if (startsWithLetterOrDigit.test(segment)) {
      return segment;
    }
  }
  return undefined;
}

/**
 * Initials of a person or an organisation: the first letters of its first and last words, such as
 * "PM" for "Paul Mercier", or a single letter for a single word.
 */
export function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .map(firstLetterOf)
    .filter((letter) => letter !== undefined);
  const first = letters[0] ?? '';
  const last = letters.length > 1 ? (letters.at(-1) ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
