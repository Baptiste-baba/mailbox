/** What Gmail writes for the characters it escapes in a snippet, as it would in a page. */
const NAMED_CHARACTERS: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/** The snippet of a Gmail message as plain text: Gmail gives it escaped for HTML. */
export function unescapeGmailSnippet(snippet: string): string {
  return snippet.replace(/&(?:#(\d{1,7})|([a-z]+));/g, (escaped, code?: string, name?: string) => {
    if (code !== undefined) {
      const codePoint = Number(code);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : escaped;
    }
    return NAMED_CHARACTERS[name ?? ''] ?? escaped;
  });
}
