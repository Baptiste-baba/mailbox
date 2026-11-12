import { Extension } from '@tiptap/core';
import { Fragment, type MarkType, type Node as ProseMirrorNode, Slice } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/** `fragment` with no text bearing a mark of `type`. */
function withoutMark(fragment: Fragment, type: MarkType): Fragment {
  const nodes: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    nodes.push(
      node.isText
        ? node.mark(type.removeFromSet(node.marks))
        : node.copy(withoutMark(node.content, type)),
    );
  });
  return Fragment.fromArray(nodes);
}

/** The text of the clipboard, its spaces and line breaks evened out by the way to it and back. */
function clipboardText(event: ClipboardEvent): string {
  return (event.clipboardData?.getData('text/plain') ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Follows where what is about to be pasted or dropped in `view` comes from: the message itself
 * when it is dragged from it, or pasted after being copied or cut from it. Any other editor of the
 * same kind marks its copies alike, so the copy is told by its text. Gives back how to stop.
 */
function followSource(view: EditorView, onSource: (fromHere: boolean) => void): () => void {
  let copied = '';
  // After the editor's own handler has put the copy on the clipboard.
  const noteCopy = (event: ClipboardEvent) => {
    copied = clipboardText(event);
  };
  // Before the editor reads what comes in.
  const notePaste = (event: ClipboardEvent) => {
    onSource(copied !== '' && clipboardText(event) === copied);
  };
  const noteDrop = () => onSource(view.dragging !== null);
  view.dom.addEventListener('copy', noteCopy);
  view.dom.addEventListener('cut', noteCopy);
  view.dom.addEventListener('paste', notePaste, { capture: true });
  view.dom.addEventListener('drop', noteDrop, { capture: true });
  return () => {
    view.dom.removeEventListener('copy', noteCopy);
    view.dom.removeEventListener('cut', noteCopy);
    view.dom.removeEventListener('paste', notePaste, { capture: true });
    view.dom.removeEventListener('drop', noteDrop, { capture: true });
  };
}

/**
 * What is pasted or dropped from elsewhere, such as a web page, comes without its fonts, sizes and
 * colours: the mail keeps one look, while bold, lists, links and alignment stay. What is copied or
 * dragged within the message itself, to move a sentence for instance, keeps all of its styles.
 */
export const PasteWithoutForeignStyles = Extension.create({
  name: 'pasteWithoutForeignStyles',
  addProseMirrorPlugins() {
    let fromHere = false;
    return [
      new Plugin({
        view: (editorView) => ({
          destroy: followSource(editorView, (source) => {
            fromHere = source;
          }),
        }),
        props: {
          transformPasted: (slice, view) => {
            const textStyle = view.state.schema.marks.textStyle;
            return fromHere || textStyle === undefined
              ? slice
              : new Slice(withoutMark(slice.content, textStyle), slice.openStart, slice.openEnd);
          },
        },
      }),
    ];
  },
});
