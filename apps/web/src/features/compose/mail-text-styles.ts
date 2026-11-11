import { fr } from '../../i18n/fr.ts';

// What the text of a mail can look like. These are part of the mail sent, not of the interface:
// fonts every mail program shows, and colours that read on a light page as on a dark one.

interface MailFont {
  name: string;
  /** The font, then the ones a reader without it sees instead. */
  stack: string;
}

/**
 * The fonts of a mail, the first being the one it has unless another is chosen. Each one is on Mac
 * and Windows alike, or comes with a close one in its place.
 */
export const mailFonts: [MailFont, ...MailFont[]] = [
  { name: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica', stack: 'Helvetica, Arial, sans-serif' },
  { name: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { name: 'Tahoma', stack: 'Tahoma, Verdana, sans-serif' },
  { name: 'Trebuchet MS', stack: 'Trebuchet MS, Helvetica, sans-serif' },
  { name: 'Gill Sans', stack: 'Gill Sans, Gill Sans MT, Calibri, sans-serif' },
  { name: 'Georgia', stack: 'Georgia, Times New Roman, serif' },
  { name: 'Times New Roman', stack: 'Times New Roman, Times, serif' },
  { name: 'Palatino', stack: 'Palatino, Palatino Linotype, Book Antiqua, serif' },
  { name: 'Courier New', stack: 'Courier New, Courier, monospace' },
  { name: 'Comic Sans MS', stack: 'Comic Sans MS, Comic Sans, cursive' },
  { name: 'Impact', stack: 'Impact, Arial Black, sans-serif' },
];

/** Sizes in points, as in word processors: 12 is the size a mail has unless another is chosen. */
export const DEFAULT_SIZE = 12;
export const MIN_SIZE = 1;
export const MAX_SIZE = 100;

interface MailColour {
  id: string;
  label: string;
  /** Unset for the text colour of whoever reads the mail, dark on light or light on dark. */
  colour?: string;
}

// Each colour has a contrast of at least 4.5:1 on white and 3.7:1 on the app's dark surface.
export const mailColours: MailColour[] = [
  { id: 'auto', label: fr.compose.colourAuto },
  { id: 'grey', label: fr.compose.colourGrey, colour: '#767676' },
  { id: 'red', label: fr.compose.colourRed, colour: '#e12f2f' },
  { id: 'orange', label: fr.compose.colourOrange, colour: '#b3611a' },
  { id: 'green', label: fr.compose.colourGreen, colour: '#13883a' },
  { id: 'blue', label: fr.compose.colourBlue, colour: '#2774e0' },
  { id: 'purple', label: fr.compose.colourPurple, colour: '#9b4fe6' },
  { id: 'pink', label: fr.compose.colourPink, colour: '#df2080' },
];
