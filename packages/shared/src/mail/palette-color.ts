import * as z from 'zod';

/** Colours the user can give a mailbox: the blue shades of the design palette. */
export const paletteColorSchema = z.enum(['navy', 'azur', 'ciel', 'glacier', 'slate']);

export type PaletteColor = z.infer<typeof paletteColorSchema>;
