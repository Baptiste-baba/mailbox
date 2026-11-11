import { fr } from '../../i18n/fr.ts';

interface ComposeBodyProps {
  body: string;
  onChange: (body: string) => void;
}

/**
 * The message itself, in plain text, under the fields: it takes the rest of the pane and stops at
 * the width of a mail being read.
 */
export function ComposeBody({ body, onChange }: ComposeBodyProps) {
  return (
    <textarea
      aria-label={fr.compose.body}
      value={body}
      onChange={(event) => onChange(event.target.value)}
      placeholder={fr.compose.bodyPlaceholder}
      className="min-h-40 w-full max-w-reading flex-1 resize-none bg-transparent px-6 py-5 text-body text-ink outline-none placeholder:text-ink-2"
    />
  );
}
