import { pgEnum } from 'drizzle-orm/pg-core';

/** Colours the user can give a mailbox: the blue shades of the design palette. */
export const paletteColor = pgEnum('palette_color', ['navy', 'azur', 'ciel', 'glacier', 'slate']);
