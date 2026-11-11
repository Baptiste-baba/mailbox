import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
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
    link: false,
  }),
  // What is typed right after a link is not part of it. A link opens from a mail being read, never
  // from the one being written; an address typed, or pasted on some text, becomes a link.
  Link.extend({ inclusive: () => false }).configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    defaultProtocol: 'https',
  }),
  TextAlign.configure({ types: ['paragraph'], alignments: ['left', 'center', 'right'] }),
  Placeholder.configure({ placeholder: fr.compose.bodyPlaceholder }),
];

/** Lists, links and the example shown while empty, in the editor that has none of them styled. */
const contentClassNames = [
  'max-w-reading px-6 py-5 text-body text-ink outline-none',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-6 [&_a]:text-link [&_a]:underline',
  '[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-ink-2 [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
].join(' ');

/** Whether the key pressed is ⌘K, or Ctrl+K away from a Mac. */
const isLinkShortcut = (event: KeyboardEvent) =>
  event.key === 'k' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey;

/**
 * The editor of the message, holding `body` as HTML and giving back every change. ⌘B, ⌘I and ⌘U
 * style the text, ⌘Z undoes, "- " or "1. " starts a list, ⌘K asks for a link.
 */
export function useMessageEditor(
  body: string,
  onChange: (body: string) => void,
  onLinkShortcut: () => void,
): Editor {
  return useEditor({
    extensions,
    content: body,
    // Only lists start as they are typed, and links as addresses are pasted: no other text turns
    // into a style by surprise.
    enableInputRules: ['bulletList', 'orderedList'],
    enablePasteRules: ['link'],
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (!isLinkShortcut(event)) {
          return false;
        }
        onLinkShortcut();
        return true;
      },
      attributes: {
        'aria-label': fr.compose.body,
        'aria-multiline': 'true',
        class: contentClassNames,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
}

/** The message itself, under the fields: it takes the rest of the pane, at a reading width. */
export function MessageEditor({ editor }: { editor: Editor }) {
  return <EditorContent editor={editor} className="flex min-h-40 flex-1 flex-col [&>div]:flex-1" />;
}
