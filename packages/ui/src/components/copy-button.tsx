import { CheckIcon, CopyIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './button.tsx';

/** How long the button says the copy worked, or failed. */
const FEEDBACK_MS = 2_000;

interface CopyButtonProps {
  /** What goes to the clipboard. */
  text: string;
  label: string;
  copiedLabel: string;
  /** Said when the browser refuses the clipboard, so that the user copies by hand. */
  failedLabel: string;
  className?: string;
}

/** Copies a text to the clipboard, then says it did for a moment. */
export function CopyButton({ text, label, copiedLabel, failedLabel, className }: CopyButtonProps) {
  const [outcome, setOutcome] = useState<'copied' | 'failed' | undefined>();
  useEffect(() => {
    if (outcome === undefined) {
      return;
    }
    const timer = setTimeout(() => setOutcome(undefined), FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [outcome]);
  const copy = () =>
    navigator.clipboard.writeText(text).then(
      () => setOutcome('copied'),
      () => setOutcome('failed'),
    );
  const feedback = { copied: copiedLabel, failed: failedLabel };
  return (
    <Button variant="secondary" size="sm" onClick={copy} className={className}>
      {outcome === 'copied' ? <CheckIcon /> : <CopyIcon />}
      {/* Read aloud as soon as it changes. */}
      <span aria-live="polite">{outcome === undefined ? label : feedback[outcome]}</span>
    </Button>
  );
}
