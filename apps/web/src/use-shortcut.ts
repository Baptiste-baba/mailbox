import { useEffect, useEffectEvent } from 'react';
import { type ShortcutId, shortcuts } from './shortcuts.ts';

function isTyping(target: EventTarget | null): boolean {
  // A radio only takes arrows and space: a letter pressed on it is still a shortcut.
  if (target instanceof HTMLInputElement) {
    return target.type !== 'radio';
  }
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * Runs `handler` when the key of the shortcut is pressed, unless the user is typing text and the
 * shortcut does not work while typing.
 */
export function useShortcut(id: ShortcutId, handler: () => void): void {
  const onShortcut = useEffectEvent(handler);
  useEffect(() => {
    const { key, whileTyping = false } = shortcuts[id];
    function onKeyDown(event: KeyboardEvent) {
      // While an input method composes a word, Escape and the other keys are its own.
      if (
        event.isComposing ||
        event.key !== key ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (isTyping(event.target) && !whileTyping)
      ) {
        return;
      }
      event.preventDefault();
      onShortcut();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [id]);
}
