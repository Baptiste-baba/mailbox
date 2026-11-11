export type ShortcutId =
  | 'newMail'
  | 'closeComposer'
  | 'send'
  | 'search'
  | 'searchList'
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
  /** Triggers even while the user is typing text, as Escape does. */
  whileTyping?: boolean;
}

/** Every keyboard shortcut of the app. */
export const shortcuts: Record<ShortcutId, Shortcut> = {
  newMail: { label: 'C', key: 'c' },
  closeComposer: { label: 'Échap', key: 'Escape', whileTyping: true },
  send: { label: '⌘↵' },
  search: { label: '⌘K' },
  searchList: { label: '/' },
  nextThread: { label: 'J', key: 'j' },
  previousThread: { label: 'K', key: 'k' },
  unreadOnly: { label: 'U', key: 'u' },
  archive: { label: 'E' },
  snooze: { label: 'H' },
  translate: { label: 'T' },
  reply: { label: 'R' },
};
