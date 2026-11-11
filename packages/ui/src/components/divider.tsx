/** A rule across the width with a short word in its middle, such as "ou" between two ways to go. */
export function Divider({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-4 text-small text-ink-2 before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
      {label}
    </p>
  );
}
