import { IconButton, Toolbar, ToolbarGroup, ToolbarSeparator } from '@mailbox/ui';
import type { Editor } from '@tiptap/react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';
import { useLayout } from '../../shell/layout.ts';
import {
  commonToggleGroups,
  LinkGroup,
  ToggleGroup,
  toggleGroups,
  useFormatting,
} from './format-controls.tsx';
import { ColourMenu, FontMenu, SizeStepper } from './text-style-controls.tsx';
import { useFormatBarUnfolded } from './use-format-bar-unfolded.ts';

interface FormatBarProps {
  editor: Editor;
  /** Asks for the link of the text at the cursor, to add, change or remove. */
  onWriteLink: () => void;
  /** Actions after the formatting, before the button that unfolds it. */
  end?: ReactNode;
}

/**
 * The formatting of the message, above the actions of the mail: each button lights up while the
 * text at the cursor has its style, and gives the keyboard back to the text once pressed. Folded,
 * it holds the common options only; the button at its end unfolds it to all of them. On a phone,
 * folded, it leaves out the font, its size and its colour, for the rest to fit on one line.
 */
export function FormatBar({ editor, onWriteLink, end }: FormatBarProps) {
  const { unfolded, toggleUnfolded } = useFormatBarUnfolded();
  const { active, run, clear } = useFormatting(editor);
  const phone = useLayout() === 'phone';
  return (
    <Toolbar
      label={fr.compose.formatting}
      className="flex-none border-t border-line px-4 py-1.5 phone:px-2"
    >
      {(unfolded || !phone) && (
        <ToolbarGroup>
          <FontMenu editor={editor} />
          <SizeStepper editor={editor} />
          <ColourMenu editor={editor} />
          <ToolbarSeparator />
        </ToolbarGroup>
      )}
      {(unfolded ? toggleGroups : commonToggleGroups).map((group) => (
        <ToggleGroup key={group[0]?.id} group={group} active={active.styles} onApply={run} />
      ))}
      <LinkGroup
        linked={active.link}
        onWriteLink={onWriteLink}
        onClear={unfolded ? clear : undefined}
      />
      {end}
      <IconButton
        label={unfolded ? fr.compose.lessFormatting : fr.compose.moreFormatting}
        onClick={toggleUnfolded}
        className="ml-auto"
      >
        {unfolded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </IconButton>
    </Toolbar>
  );
}
