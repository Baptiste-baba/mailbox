import type { ThreadSummary, ThreadView } from '@mailbox/shared';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useShortcut } from '../../use-shortcut.ts';

/** J and K open the next and the previous thread of the list, `reveal` scrolls it into view. */
export function useThreadKeyboard(
  threads: ThreadSummary[],
  view: ThreadView,
  reveal: (index: number) => void,
): void {
  const navigate = useNavigate();
  const selectedId = useParams({ strict: false }).id;
  const open = (step: 1 | -1) => {
    const current = threads.findIndex((thread) => thread.id === selectedId);
    const next = current === -1 ? 0 : Math.min(Math.max(current + step, 0), threads.length - 1);
    const thread = threads[next];
    if (thread === undefined || next === current) {
      return;
    }
    reveal(next);
    navigate({ to: '/$view/$id', params: { view, id: thread.id }, search: (previous) => previous });
  };
  useShortcut('nextThread', () => open(1));
  useShortcut('previousThread', () => open(-1));
}
