import { IconButton, ToolbarGroup, ToolbarSeparator } from '@mailbox/ui';
import { type ChainedCommands, type Editor, useEditorState } from '@tiptap/react';
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  RemoveFormattingIcon,
  StrikethroughIcon,
  TextAlignCenterIcon,
  TextAlignEndIcon,
  TextAlignStartIcon,
  UnderlineIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';
import { type ShortcutId, shortcuts } from '../../shortcuts.ts';

// The controls the formatting bar and the bubble over the chosen text share.

/** A style the text at the cursor has or not, and the button that gives or takes it. */
interface FormatToggle {
  id: ShortcutId;
  label: string;
  icon: ReactNode;
  /** Shown in the folded bar too: one of the styles used most. */
  common: boolean;
  apply: (chain: ChainedCommands) => ChainedCommands;
  isActive: (editor: Editor) => boolean;
}

/** Text without an alignment is aligned to the left, as it will show in the mail. */
const isAlignedLeft = (editor: Editor) =>
  !editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' });

/** The toggles, by group: styles of the text, alignment, lists. */
export const toggleGroups: FormatToggle[][] = [
  [
    {
      id: 'bold',
      label: fr.compose.bold,
      icon: <BoldIcon />,
      common: true,
      apply: (chain) => chain.toggleBold(),
      isActive: (editor) => editor.isActive('bold'),
    },
    {
      id: 'italic',
      label: fr.compose.italic,
      icon: <ItalicIcon />,
      common: true,
      apply: (chain) => chain.toggleItalic(),
      isActive: (editor) => editor.isActive('italic'),
    },
    {
      id: 'underline',
      label: fr.compose.underline,
      icon: <UnderlineIcon />,
      common: true,
      apply: (chain) => chain.toggleUnderline(),
      isActive: (editor) => editor.isActive('underline'),
    },
    {
      id: 'strike',
      label: fr.compose.strike,
      icon: <StrikethroughIcon />,
      common: false,
      apply: (chain) => chain.toggleStrike(),
      isActive: (editor) => editor.isActive('strike'),
    },
  ],
  [
    {
      id: 'alignLeft',
      label: fr.compose.alignLeft,
      icon: <TextAlignStartIcon />,
      common: false,
      apply: (chain) => chain.unsetTextAlign(),
      isActive: isAlignedLeft,
    },
    {
      id: 'alignCenter',
      label: fr.compose.alignCenter,
      icon: <TextAlignCenterIcon />,
      common: false,
      apply: (chain) => chain.setTextAlign('center'),
      isActive: (editor) => editor.isActive({ textAlign: 'center' }),
    },
    {
      id: 'alignRight',
      label: fr.compose.alignRight,
      icon: <TextAlignEndIcon />,
      common: false,
      apply: (chain) => chain.setTextAlign('right'),
      isActive: (editor) => editor.isActive({ textAlign: 'right' }),
    },
  ],
  [
    {
      id: 'bulletList',
      label: fr.compose.bulletList,
      icon: <ListIcon />,
      common: true,
      apply: (chain) => chain.toggleBulletList(),
      isActive: (editor) => editor.isActive('bulletList'),
    },
    {
      id: 'orderedList',
      label: fr.compose.orderedList,
      icon: <ListOrderedIcon />,
      common: true,
      apply: (chain) => chain.toggleOrderedList(),
      isActive: (editor) => editor.isActive('orderedList'),
    },
  ],
];

export const toggles = toggleGroups.flat();

/** The groups of the folded bar, with only their common toggles. */
export const commonToggleGroups = toggleGroups
  .map((group) => group.filter((toggle) => toggle.common))
  .filter((group) => group.length > 0);

interface ToggleGroupProps {
  group: FormatToggle[];
  /** Which styles the text at the cursor has, by toggle. */
  active: Record<string, boolean>;
  onApply: (apply: FormatToggle['apply']) => void;
}

/** One group of toggles, then the line that sets it apart from the next. */
export function ToggleGroup({ group, active, onApply }: ToggleGroupProps) {
  return (
    <ToolbarGroup>
      {group.map((toggle) => (
        <IconButton
          key={toggle.id}
          label={toggle.label}
          shortcut={shortcuts[toggle.id].label}
          pressed={active[toggle.id] ?? false}
          onClick={() => onApply(toggle.apply)}
        >
          {toggle.icon}
        </IconButton>
      ))}
      <ToolbarSeparator />
    </ToolbarGroup>
  );
}

interface LinkGroupProps {
  /** Whether the text at the cursor is a link. */
  linked: boolean;
  onWriteLink: () => void;
  /** Takes every style off the text at the cursor; left out where it is not offered. */
  onClear?: (() => void) | undefined;
}

/** The link of the text at the cursor, then, where it is offered, the clearing of its formatting. */
export function LinkGroup({ linked, onWriteLink, onClear }: LinkGroupProps) {
  return (
    <ToolbarGroup>
      <IconButton
        label={fr.compose.link}
        shortcut={shortcuts.link.label}
        pressed={linked}
        onClick={onWriteLink}
      >
        <LinkIcon />
      </IconButton>
      {onClear !== undefined && (
        <>
          <ToolbarSeparator />
          <IconButton label={fr.compose.clearFormatting} onClick={onClear}>
            <RemoveFormattingIcon />
          </IconButton>
        </>
      )}
    </ToolbarGroup>
  );
}

/**
 * Which styles the text at the cursor has, and what gives or takes them: each change gives the
 * keyboard back to the text.
 */
export function useFormatting(editor: Editor) {
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      styles: Object.fromEntries(toggles.map((toggle) => [toggle.id, toggle.isActive(current)])),
      link: current.isActive('link'),
    }),
  });
  const run = (apply: (chain: ChainedCommands) => ChainedCommands) =>
    apply(editor.chain().focus()).run();
  const clear = () => run((chain) => chain.unsetAllMarks().unsetTextAlign().clearNodes());
  return { active, run, clear };
}
