import { useState } from 'react';
import type { ComposeDraft } from './compose-draft.ts';
import { ComposeEnvelope } from './compose-envelope.tsx';
import { FormatBar } from './format-bar.tsx';
import { LinkPanel } from './link-panel.tsx';
import { MessageEditor, useMessageEditor } from './message-editor.tsx';

interface ComposeMessageProps {
  draft: ComposeDraft;
  onChange: (changes: Partial<ComposeDraft>) => void;
}

/**
 * The mail being written: its fields and its message, which scroll together, then the formatting
 * bar, or the link being written in its place.
 */
export function ComposeMessage({ draft, onChange }: ComposeMessageProps) {
  const [writingLink, setWritingLink] = useState(false);
  const editor = useMessageEditor(
    draft.body,
    (body) => onChange({ body }),
    () => setWritingLink(true),
  );
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none">
        <ComposeEnvelope draft={draft} onChange={onChange} />
        <MessageEditor editor={editor} />
      </div>
      {writingLink ? (
        <LinkPanel editor={editor} onDone={() => setWritingLink(false)} />
      ) : (
        <FormatBar editor={editor} onWriteLink={() => setWritingLink(true)} />
      )}
    </>
  );
}
