/**
 * Disabled and pressed states of every button. Disabled, a button fades: it cannot be used for now.
 * Marked `aria-disabled`, it keeps its look but does not react, and its hint says why.
 */
export const pressableClassNames =
  'disabled:cursor-not-allowed disabled:opacity-55 motion-safe:available:active:scale-98';
