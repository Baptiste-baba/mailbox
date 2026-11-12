import { type Choice, ChoiceMenu, NumberStepper } from '@mailbox/ui';
import { type Editor, useEditorState } from '@tiptap/react';
import { fr } from '../../i18n/fr.ts';
import {
  DEFAULT_SIZE,
  MAX_SIZE,
  type MailColour,
  MIN_SIZE,
  mailColours,
  mailFonts,
} from './mail-text-styles.ts';

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

/** The colours of the palette by the way the browser writes them, to tell the one at the cursor. */
const paletteColours = new Map(
  mailColours.flatMap((choice): [string, MailColour][] =>
    choice.colour === undefined ? [] : [[normalColour(choice.colour), choice]],
  ),
);

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
    <span className="block size-5 rounded-full bg-ink" style={{ backgroundColor: colour.colour }} />
  ),
}));

/** The font, size in points and colour of the text at the cursor. */
function styleAtCursor(editor: Editor) {
  const { fontFamily, fontSize, color }: Record<string, unknown> =
    editor.getAttributes('textStyle');
  const fontName = typeof fontFamily === 'string' ? firstFont(fontFamily) : undefined;
  const size = typeof fontSize === 'string' ? Number.parseFloat(fontSize) : Number.NaN;
  return {
    font: mailFonts.find((font) => font.name === fontName) ?? defaultFont,
    size: Number.isFinite(size) ? size : DEFAULT_SIZE,
    colour: typeof color === 'string' ? paletteColours.get(normalColour(color)) : undefined,
  };
}

/** The font, size and colour at the cursor, and what choosing another one does to the text. */
function useTextStyle(editor: Editor) {
  const current = useEditorState({ editor, selector: ({ editor: at }) => styleAtCursor(at) });
  const chooseFont = (name: string) => {
    const font = mailFonts.find((candidate) => candidate.name === name);
    const chain = editor.chain().focus();
    (font === undefined || font === defaultFont
      ? chain.unsetFontFamily()
      : chain.setFontFamily(font.stack)
    ).run();
  };
  // The size is stepped from its own field, which keeps the keyboard until Enter.
  const chooseSize = (size: number) => {
    const chain = editor.chain();
    (size === DEFAULT_SIZE ? chain.unsetFontSize() : chain.setFontSize(`${size}pt`)).run();
  };
  const chooseColour = (id: string) => {
    const colour = mailColours.find((candidate) => candidate.id === id)?.colour;
    const chain = editor.chain().focus();
    (colour === undefined ? chain.unsetColor() : chain.setColor(colour)).run();
  };
  return { current, chooseFont, chooseSize, chooseColour };
}

/** The font of the text, from a menu that shows each one as it will look. */
export function FontMenu({ editor }: { editor: Editor }) {
  const { current, chooseFont } = useTextStyle(editor);
  return (
    <ChoiceMenu
      label={fr.compose.font}
      choices={fontChoices}
      value={current.font.name}
      onChoose={chooseFont}
    >
      <span className="max-w-18 truncate" style={{ fontFamily: current.font.stack }}>
        {current.font.name}
      </span>
    </ChoiceMenu>
  );
}

/** The size of the text, as a number of points typed or stepped one by one. */
export function SizeStepper({ editor }: { editor: Editor }) {
  const { current, chooseSize } = useTextStyle(editor);
  return (
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
  );
}

/** The colour of the text, from swatches; "Automatique" leaves it to whoever reads the mail. */
export function ColourMenu({ editor }: { editor: Editor }) {
  const { current, chooseColour } = useTextStyle(editor);
  return (
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
  );
}
