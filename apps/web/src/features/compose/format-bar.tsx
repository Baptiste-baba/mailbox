import { IconButton, Toolbar, ToolbarSeparator } from '@mailbox/ui';
import { type ChainedCommands, type Editor, useEditorState } from '@tiptap/react';
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  RemoveFormattingIcon,
  StrikethroughIcon,
  TextAlignCenterIcon,
  TextAlignEndIcon,
  TextAlignStartIcon,
  UnderlineIcon,
} from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';
import { type ShortcutId, shortcuts } from '../../shortcuts.ts';

/** A style the text at the cursor has or not, and the button that gives or takes it. */
interface FormatToggle {
  id: ShortcutId;
  label: string;
  icon: ReactNode;
  apply: (chain: ChainedCommands) => ChainedCommands;
  isActive: (editor: Editor) => boolean;
}

/** Text without an alignment is aligned to the left, as it will show in the mail. */
const isAlignedLeft = (editor: Editor) =>
  !editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' });

/** The toggles, by group: styles of the text, alignment, lists. */
const toggleGroups: FormatToggle[][] = [
  [
    {
      id: 'bold',
      label: fr.compose.bold,
      icon: <BoldIcon />,
      apply: (chain) => chain.toggleBold(),
      isActive: (editor) => editor.isActive('bold'),
    },
    {
      id: 'italic',
      label: fr.compose.italic,
      icon: <ItalicIcon />,
      apply: (chain) => chain.toggleItalic(),
      isActive: (editor) => editor.isActive('italic'),
    },
    {
      id: 'underline',
      label: fr.compose.underline,
      icon: <UnderlineIcon />,
      apply: (chain) => chain.toggleUnderline(),
      isActive: (editor) => editor.isActive('underline'),
    },
    {
      id: 'strike',
      label: fr.compose.strike,
      icon: <StrikethroughIcon />,
      apply: (chain) => chain.toggleStrike(),
      isActive: (editor) => editor.isActive('strike'),
    },
  ],
  [
    {
      id: 'alignLeft',
      label: fr.compose.alignLeft,
      icon: <TextAlignStartIcon />,
      apply: (chain) => chain.unsetTextAlign(),
      isActive: isAlignedLeft,
    },
    {
      id: 'alignCenter',
      label: fr.compose.alignCenter,
      icon: <TextAlignCenterIcon />,
      apply: (chain) => chain.setTextAlign('center'),
      isActive: (editor) => editor.isActive({ textAlign: 'center' }),
    },
    {
      id: 'alignRight',
      label: fr.compose.alignRight,
      icon: <TextAlignEndIcon />,
      apply: (chain) => chain.setTextAlign('right'),
      isActive: (editor) => editor.isActive({ textAlign: 'right' }),
    },
  ],
  [
    {
      id: 'bulletList',
      label: fr.compose.bulletList,
      icon: <ListIcon />,
      apply: (chain) => chain.toggleBulletList(),
      isActive: (editor) => editor.isActive('bulletList'),
    },
    {
      id: 'orderedList',
      label: fr.compose.orderedList,
      icon: <ListOrderedIcon />,
      apply: (chain) => chain.toggleOrderedList(),
      isActive: (editor) => editor.isActive('orderedList'),
    },
  ],
];

const toggles = toggleGroups.flat();

/**
 * The formatting of the message, above the actions of the mail: each button lights up while the
 * text at the cursor has its style, and gives the keyboard back to the text once pressed.
 */
export function FormatBar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      Object.fromEntries(toggles.map((toggle) => [toggle.id, toggle.isActive(current)])),
  });
  const run = (apply: (chain: ChainedCommands) => ChainedCommands) =>
    apply(editor.chain().focus()).run();
  return (
    <Toolbar label={fr.compose.formatting} className="flex-none border-t border-line px-4 py-1.5">
      {toggleGroups.map((group) => (
        <Fragment key={group[0]?.id}>
          {group.map((toggle) => (
            <IconButton
              key={toggle.id}
              label={toggle.label}
              shortcut={shortcuts[toggle.id].label}
              pressed={active[toggle.id] ?? false}
              onClick={() => run(toggle.apply)}
            >
              {toggle.icon}
            </IconButton>
          ))}
          <ToolbarSeparator />
        </Fragment>
      ))}
      <IconButton
        label={fr.compose.clearFormatting}
        onClick={() => run((chain) => chain.unsetAllMarks().unsetTextAlign().clearNodes())}
      >
        <RemoveFormattingIcon />
      </IconButton>
    </Toolbar>
  );
}
