/** Hover hint of a sidebar item: its name, then what it shows, so that the reduced sidebar keeps it. */
export function hint(...parts: (string | false | undefined)[]): string {
  return parts.filter((part) => typeof part === 'string' && part !== '').join(' · ');
}
