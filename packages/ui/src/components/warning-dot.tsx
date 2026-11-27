/**
 * A small orange dot at the end of an item, saying that something needs attention there. It is
 * hidden from screen readers: the hint or the text of the item says what.
 */
export function WarningDot() {
  return <span aria-hidden="true" className="size-1.5 flex-none rounded-full bg-warn" />;
}
