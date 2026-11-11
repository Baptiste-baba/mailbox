import { Extension } from '@tiptap/core';
import { Fragment, type MarkType, type Node as ProseMirrorNode, Slice } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';

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

/** Whether what is about to be pasted was copied from this editor, which marks its own copies. */
function isCopiedHere(event: ClipboardEvent): boolean {
  return event.clipboardData?.getData('text/html').includes('data-pm-slice') ?? false;
}

/**
 * What is pasted from elsewhere, such as a web page, comes without its fonts, sizes and colours:
 * the mail keeps one look, while bold, lists, links and alignment stay. What is copied within the
 * message itself, to move a sentence for instance, keeps all of its styles.
 */
export const PasteWithoutForeignStyles = Extension.create({
  name: 'pasteWithoutForeignStyles',
  addProseMirrorPlugins() {
    let copiedHere = false;
    const notePaste = (event: ClipboardEvent) => {
      copiedHere = isCopiedHere(event);
    };
    return [
      new Plugin({
        // Notes where the paste comes from before the editor reads it.
        view: (editorView) => {
          editorView.dom.addEventListener('paste', notePaste, { capture: true });
          return {
            destroy: () =>
              editorView.dom.removeEventListener('paste', notePaste, { capture: true }),
          };
        },
        props: {
          transformPasted: (slice, view) => {
            const textStyle = view.state.schema.marks.textStyle;
            return copiedHere || textStyle === undefined
              ? slice
              : new Slice(withoutMark(slice.content, textStyle), slice.openStart, slice.openEnd);
          },
        },
      }),
    ];
  },
});
