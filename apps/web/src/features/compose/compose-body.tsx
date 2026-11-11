import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { fr } from '../../i18n/fr.ts';

/**
 * What the message can hold: paragraphs, lists, links and the styles of the text. Anything else,
 * pasted from a web page for instance, does not get in: no script, no foreign style.
 */
const extensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    // No empty paragraph kept at the end of every message: Enter twice leaves a list.
    trailingNode: false,
    // A link opens from a mail being read, never from the one being written.
    link: { openOnClick: false, autolink: false, linkOnPaste: false },
  }),
  Placeholder.configure({ placeholder: fr.compose.bodyPlaceholder }),
];

/** Lists, links and the example shown while empty, in the editor that has none of them styled. */
const contentClassNames = [
  'max-w-reading px-6 py-5 text-body text-ink outline-none',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-6 [&_a]:text-link [&_a]:underline',
  '[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-ink-2 [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
].join(' ');

interface ComposeBodyProps {
  /** The message, as HTML. */
  body: string;
  onChange: (body: string) => void;
}

/**
 * The message itself, under the fields: it takes the rest of the pane and stops at the width of a
 * mail being read. ⌘B, ⌘I and ⌘U style the text, ⌘Z undoes, "- " or "1. " starts a list.
 */
export function ComposeBody({ body, onChange }: ComposeBodyProps) {
  const editor = useEditor({
    extensions,
    content: body,
    // Only lists start as they are typed: no other text turns into a style by surprise.
    enableInputRules: ['bulletList', 'orderedList'],
    enablePasteRules: false,
    editorProps: {
      attributes: {
        'aria-label': fr.compose.body,
        'aria-multiline': 'true',
        class: contentClassNames,
      },
    },
    onUpdate: ({ editor: updated }) => onChange(updated.getHTML()),
  });
  return <EditorContent editor={editor} className="flex min-h-40 flex-1 flex-col [&>div]:flex-1" />;
}
