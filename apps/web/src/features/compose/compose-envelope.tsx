import { BareInput, Button, FieldLine } from '@mailbox/ui';
import { useId, useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import type { ComposeDraft } from './compose-draft.ts';
import { RecipientsLine } from './recipients-line.tsx';
import { SenderLine } from './sender-line.tsx';

interface ComposeEnvelopeProps {
  draft: ComposeDraft;
  onChange: (changes: Partial<ComposeDraft>) => void;
}

/**
 * Who the mail goes from and to, and its subject. "Cc" and "Cci" show their lines when asked for,
 * or by themselves once they hold someone.
 */
export function ComposeEnvelope({ draft, onChange }: ComposeEnvelopeProps) {
  const [asked, setAsked] = useState({ cc: false, bcc: false });
  const showCc = asked.cc || draft.cc.length > 0;
  const showBcc = asked.bcc || draft.bcc.length > 0;
  const ask = (line: 'cc' | 'bcc') => setAsked({ ...asked, [line]: true });
  return (
    <div className="flex flex-none flex-col px-6">
      <SenderLine
        chosenId={draft.fromMailboxId}
        onChoose={(fromMailboxId) => onChange({ fromMailboxId })}
      />
      <RecipientsLine
        label={fr.compose.to}
        recipients={draft.to}
        onChange={(to) => onChange({ to })}
        autoFocus
        trailing={<AskCopyButtons cc={!showCc} bcc={!showBcc} onAsk={ask} />}
      />
      {showCc && (
        <RecipientsLine
          label={fr.compose.cc}
          recipients={draft.cc}
          onChange={(cc) => onChange({ cc })}
          autoFocus={asked.cc}
        />
      )}
      {showBcc && (
        <RecipientsLine
          label={fr.compose.bcc}
          recipients={draft.bcc}
          onChange={(bcc) => onChange({ bcc })}
          autoFocus={asked.bcc}
        />
      )}
      <SubjectLine subject={draft.subject} onChange={(subject) => onChange({ subject })} />
    </div>
  );
}

interface AskCopyButtonsProps {
  /** Whether "Cc" is still to ask for. */
  cc: boolean;
  /** Whether "Cci" is still to ask for. */
  bcc: boolean;
  onAsk: (line: 'cc' | 'bcc') => void;
}

/** "Cc" and "Cci" at the end of the "À" line, each until its own line shows. */
function AskCopyButtons({ cc, bcc, onAsk }: AskCopyButtonsProps) {
  return (
    <>
      {cc && (
        <Button variant="text" size="sm" title={fr.compose.addCc} onClick={() => onAsk('cc')}>
          {fr.compose.cc}
        </Button>
      )}
      {bcc && (
        <Button variant="text" size="sm" title={fr.compose.addBcc} onClick={() => onAsk('bcc')}>
          {fr.compose.bcc}
        </Button>
      )}
    </>
  );
}

interface SubjectLineProps {
  subject: string;
  onChange: (subject: string) => void;
}

function SubjectLine({ subject, onChange }: SubjectLineProps) {
  const id = useId();
  return (
    <FieldLine label={fr.compose.subject} htmlFor={id}>
      <BareInput
        id={id}
        value={subject}
        onChange={(event) => onChange(event.target.value)}
        placeholder={fr.compose.subjectPlaceholder}
        className="w-full"
      />
    </FieldLine>
  );
}
