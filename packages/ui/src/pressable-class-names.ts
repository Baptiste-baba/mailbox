/**
 * Disabled and pressed states of every button. Disabled, a button fades: it cannot be used for now.
 * Marked `aria-disabled`, it keeps its look but does not react: it does not exist yet, and its hint
 * says so.
 */
export const pressableClassNames =
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed motion-safe:available:active:scale-98';
