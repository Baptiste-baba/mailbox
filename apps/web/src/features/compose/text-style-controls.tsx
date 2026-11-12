import { type Choice, ChoiceMenu, NumberStepper } from '@mailbox/ui';
import { type ChainedCommands, type Editor, useEditorState } from '@tiptap/react';
import { fr } from '../../i18n/fr.ts';
import { DEFAULT_SIZE, MAX_SIZE, MIN_SIZE, mailColours, mailFonts } from './mail-text-styles.ts';

/** The first font of a font list, however the browser writes it back: "Courier New". */
function firstFont(stack: string): string {
  return (stack.split(',')[0] ?? '').replace(/["']/g, '').trim();
}

/** A colour as the browser writes it, so that "#e12f2f" and "rgb(225, 47, 47)" compare equal. */
function normalColour(colour: string): string {
  const probe = document.createElement('span');
  probe.style.color = colour;
  return probe.style.color;
}

const defaultFont = mailFonts[0];

const fontChoices: Choice[] = mailFonts.map((font) => ({
  value: font.name,
  label: font.name,
  content: <span style={{ fontFamily: font.stack }}>{font.name}</span>,
}));

/** "Automatique" shows in the text colour of the interface, as it will in the reader's. */
const colourChoices: Choice[] = mailColours.map((colour) => ({
  value: colour.id,
  label: colour.label,
  content: (
    <span
      className={
        colour.colour === undefined
          ? 'block size-5 rounded-full bg-ink'
          : 'block size-5 rounded-full'
      }
      style={{ backgroundColor: colour.colour }}
    />
  ),
}));

/** The font, size in points and colour of the text at the cursor. */
function styleAtCursor(editor: Editor) {
  const { fontFamily, fontSize, color }: Record<string, unknown> =
    editor.getAttributes('textStyle');
  const font = mailFonts.find(
    (candidate) => typeof fontFamily === 'string' && candidate.name === firstFont(fontFamily),
  );
  const size = typeof fontSize === 'string' ? Number.parseFloat(fontSize) : Number.NaN;
  const colour = mailColours.find(
    (candidate) =>
      candidate.colour !== undefined &&
      typeof color === 'string' &&
      normalColour(candidate.colour) === normalColour(color),
  );
  return { font: font ?? defaultFont, size: Number.isFinite(size) ? size : DEFAULT_SIZE, colour };
}

/** The font, size and colour at the cursor, and what choosing another one does to the text. */
function useTextStyle(editor: Editor) {
  const current = useEditorState({ editor, selector: ({ editor: at }) => styleAtCursor(at) });
  const run = (apply: (chain: ChainedCommands) => ChainedCommands) =>
    apply(editor.chain().focus()).run();
  const chooseFont = (name: string) => {
    const font = mailFonts.find((candidate) => candidate.name === name);
    run((chain) =>
      font === undefined || font === defaultFont
        ? chain.unsetFontFamily()
        : chain.setFontFamily(font.stack),
    );
  };
  // The size is stepped from its own field, which keeps the keyboard until Enter.
  const chooseSize = (size: number) => {
    const chain = editor.chain();
    (size === DEFAULT_SIZE ? chain.unsetFontSize() : chain.setFontSize(`${size}pt`)).run();
  };
  const chooseColour = (id: string) => {
    const colour = mailColours.find((candidate) => candidate.id === id)?.colour;
    run((chain) => (colour === undefined ? chain.unsetColor() : chain.setColor(colour)));
  };
  return { current, chooseFont, chooseSize, chooseColour };
}

interface TextStyleControlsProps {
  editor: Editor;
  /** Whether the colour is offered too, as it is once the formatting bar is unfolded. */
  withColour: boolean;
}

/**
 * The font, the size and the colour of the text: the fonts and colours from menus that show them
 * as they will look, the size as a number of points. The defaults leave the text as the mail has it.
 */
export function TextStyleControls({ editor, withColour }: TextStyleControlsProps) {
  const { current, chooseFont, chooseSize, chooseColour } = useTextStyle(editor);
  return (
    <>
      <ChoiceMenu
        label={fr.compose.font}
        choices={fontChoices}
        value={current.font.name}
        onChoose={chooseFont}
      >
        <span className="max-w-24 truncate" style={{ fontFamily: current.font.stack }}>
          {current.font.name}
        </span>
      </ChoiceMenu>
      <NumberStepper
        label={fr.compose.size}
        value={current.size}
        min={MIN_SIZE}
        max={MAX_SIZE}
        onChange={chooseSize}
        onSubmit={() => editor.commands.focus()}
        decreaseLabel={fr.compose.decreaseSize}
        increaseLabel={fr.compose.increaseSize}
      />
      {withColour && (
        <ChoiceMenu
          label={fr.compose.colour}
          choices={colourChoices}
          value={current.colour?.id ?? 'auto'}
          onChoose={chooseColour}
          columns={4}
        >
          <span className="relative grid size-5 place-items-center font-semibold">
            A
            <span
              className="absolute inset-x-0.5 -bottom-0.5 h-1 rounded-full bg-ink"
              style={{ backgroundColor: current.colour?.colour }}
            />
          </span>
        </ChoiceMenu>
      )}
    </>
  );
}
