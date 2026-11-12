import { BareInput, Button, FieldLine } from '@mailbox/ui';
import type { Editor } from '@tiptap/react';
import { type FormEvent, type KeyboardEvent, useId, useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { linkHref } from './link-href.ts';

/** The link at the cursor, if any, and whether some text is chosen to become one. */
function linkAtCursor(editor: Editor) {
  const href: unknown = editor.getAttributes('link').href;
  return {
    href: typeof href === 'string' ? href : undefined,
    hasText: !editor.state.selection.empty,
  };
}

/** What the panel holds, and what it does with the link once the user is done. */
function useLinkEditing(editor: Editor, onDone: () => void) {
  const [start] = useState(() => linkAtCursor(editor));
  const [text, setText] = useState('');
  const [address, setAddress] = useState(start.href ?? '');
  const [invalid, setInvalid] = useState(false);
  const needsText = start.href === undefined && !start.hasText;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const href = linkHref(address);
    if (href === undefined) {
      setInvalid(true);
      return;
    }
    // Only the link the cursor is in changes: one right next to the cursor stays as it is.
    const chain =
      start.href === undefined
        ? editor.chain().focus()
        : editor.chain().focus().extendMarkRange('link');
    const link = { type: 'link', attrs: { href } };
    const shown = text.trim() || address.trim();
    (needsText
      ? chain.insertContent({ type: 'text', text: shown, marks: [link] })
      : chain.setLink({ href })
    ).run();
    onDone();
  };
  const remove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onDone();
  };
  const cancel = () => {
    editor.commands.focus();
    onDone();
  };
  const typeAddress = (typed: string) => {
    setAddress(typed);
    setInvalid(false);
  };
  return { start, needsText, text, setText, address, typeAddress, invalid, submit, remove, cancel };
}

type LinkEditing = ReturnType<typeof useLinkEditing>;

/** The text of the link when none is chosen for it, then its address. */
function LinkFields({ link, errorId }: { link: LinkEditing; errorId: string }) {
  const textId = useId();
  const addressId = useId();
  return (
    <>
      {link.needsText && (
        <FieldLine label={fr.compose.linkText} htmlFor={textId}>
          <BareInput
            id={textId}
            value={link.text}
            onChange={(event) => link.setText(event.target.value)}
            placeholder={fr.compose.linkTextPlaceholder}
            autoFocus
            className="w-full"
          />
        </FieldLine>
      )}
      <FieldLine label={fr.compose.linkAddress} htmlFor={addressId}>
        <BareInput
          id={addressId}
          value={link.address}
          onChange={(event) => link.typeAddress(event.target.value)}
          placeholder={fr.compose.linkAddressPlaceholder}
          autoFocus={!link.needsText}
          aria-invalid={link.invalid}
          aria-describedby={link.invalid ? errorId : undefined}
          className="w-full"
        />
      </FieldLine>
    </>
  );
}

/** Why the address is refused, if it is, then what can be done with the link. */
function LinkActions({ link, errorId }: { link: LinkEditing; errorId: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-3.5">
      {link.invalid && (
        <p id={errorId} className="mr-auto text-caption text-danger">
          {fr.compose.invalidLink}
        </p>
      )}
      {link.start.href !== undefined && (
        <Button variant="secondary" onClick={link.remove}>
          {fr.compose.removeLink}
        </Button>
      )}
      <Button variant="secondary" onClick={link.cancel}>
        {fr.compose.cancel}
      </Button>
      <Button variant="primary" type="submit">
        {fr.compose.applyLink}
      </Button>
    </div>
  );
}

interface LinkPanelProps {
  editor: Editor;
  /** Called once the link is applied, removed or given up: the bar comes back. */
  onDone: () => void;
}

/**
 * Where a link is written, in place of the formatting bar: its address, and its text when no text
 * is chosen for it. Enter applies it, Escape gives up, and the keyboard goes back to the message.
 */
export function LinkPanel({ editor, onDone }: LinkPanelProps) {
  const link = useLinkEditing(editor, onDone);
  const errorId = useId();
  // Escape gives up the link only: the new mail stays open. While an input method composes a
  // word, Escape is its own.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
      event.stopPropagation();
      link.cancel();
    }
  };
  return (
    <form
      aria-label={fr.compose.link}
      onSubmit={link.submit}
      onKeyDown={onKeyDown}
      className="flex flex-none flex-col border-t border-line px-6 pb-3.5"
    >
      <LinkFields link={link} errorId={errorId} />
      <LinkActions link={link} errorId={errorId} />
    </form>
  );
}
