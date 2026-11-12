import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@mailbox/ui';
import type { Editor } from '@tiptap/react';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { type FocusEvent, useEffect, useRef } from 'react';
import { fr } from '../../i18n/fr.ts';
import { LinkGroup, ToggleGroup, toggles, useFormatting } from './format-controls.tsx';
import { ColourMenu, FontMenu } from './text-style-controls.tsx';

const pluginKey = 'selectionBubble';

const bubbleToggles = toggles.filter((toggle) =>
  ['bold', 'italic', 'underline'].includes(toggle.id),
);

// Above the chosen text, below it when there is no room, and kept off the edges of the message.
const placement: NonNullable<BubbleMenuProps['options']> = {
  placement: 'top',
  offset: 8,
  flip: true,
  shift: { padding: 8 },
};

interface SelectionBubbleProps {
  editor: Editor;
  /** Asks for the link of the chosen text, to add, change or remove. */
  onWriteLink: () => void;
}

/**
 * The most used formatting, shown right above the text being chosen: the font, bold, italic,
 * underline, the colour, a link, and the clearing of it all.
 */
export function SelectionBubble({ editor, onWriteLink }: SelectionBubbleProps) {
  const { active, run, clear } = useFormatting(editor);
  const bubbleRef = useRef<HTMLDivElement>(null);
  // Setting the bubble up, which its own effect does before this one, Tiptap makes it a stop for
  // Tab: Tab goes straight to its buttons instead. A click still focuses it, keeping it shown.
  useEffect(() => {
    if (bubbleRef.current !== null) {
      bubbleRef.current.tabIndex = -1;
    }
  }, []);
  // The bubble leaves with the keyboard, when Tab takes it out of both the bubble and the message.
  // Tiptap hands over a copy of the event, whose relatedTarget only the native event can read.
  const hideWhenLeft = (event: FocusEvent<HTMLElement>) => {
    const to = event.nativeEvent.relatedTarget;
    if (
      !(to instanceof Node && (event.currentTarget.contains(to) || editor.view.dom.contains(to)))
    ) {
      editor.view.dispatch(editor.state.tr.setMeta(pluginKey, 'hide'));
    }
  };
  return (
    <BubbleMenu
      ref={bubbleRef}
      editor={editor}
      pluginKey={pluginKey}
      options={placement}
      onBlur={hideWhenLeft}
    >
      <Toolbar label={fr.compose.selectionFormatting} floating>
        <ToolbarGroup>
          <FontMenu editor={editor} />
          <ToolbarSeparator />
        </ToolbarGroup>
        <ToggleGroup group={bubbleToggles} active={active.styles} onApply={run} />
        <ToolbarGroup>
          <ColourMenu editor={editor} />
          <ToolbarSeparator />
        </ToolbarGroup>
        <LinkGroup linked={active.link} onWriteLink={onWriteLink} onClear={clear} />
      </Toolbar>
    </BubbleMenu>
  );
}
