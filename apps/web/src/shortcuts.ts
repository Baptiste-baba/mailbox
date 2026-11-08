export type ShortcutId =
  | 'newMail'
  | 'search'
  | 'settings'
  | 'nextThread'
  | 'previousThread'
  | 'unreadOnly'
  | 'archive'
  | 'snooze'
  | 'translate'
  | 'reply';

interface Shortcut {
  /** As shown next to its action. */
  label: string;
  /** The key that triggers it, for the shortcuts that work already. */
  key?: string;
}

/** Every keyboard shortcut of the app. */
export const shortcuts: Record<ShortcutId, Shortcut> = {
  newMail: { label: 'C' },
  search: { label: '⌘K' },
  settings: { label: '⌘,' },
  nextThread: { label: 'J', key: 'j' },
  previousThread: { label: 'K', key: 'k' },
  unreadOnly: { label: 'U', key: 'u' },
  archive: { label: 'E' },
  snooze: { label: 'H' },
  translate: { label: 'T' },
  reply: { label: 'R' },
};
