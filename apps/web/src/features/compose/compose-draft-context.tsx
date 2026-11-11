import { createContext, type ReactNode, use, useState } from 'react';
import { type ComposeDraft, emptyDraft } from './compose-draft.ts';

interface ComposeDraftState {
  draft: ComposeDraft;
  change: (changes: Partial<ComposeDraft>) => void;
  /** Throws the draft away: the next new mail starts empty. */
  discard: () => void;
}

const ComposeDraftContext = createContext<ComposeDraftState | undefined>(undefined);

/**
 * Keeps the new mail being written while the app is open, its window shown or not: closing it, or
 * reading another mail, loses nothing. A reload starts afresh.
 */
export function ComposeDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState(emptyDraft);
  const state: ComposeDraftState = {
    draft,
    change: (changes) => setDraft((current) => ({ ...current, ...changes })),
    discard: () => setDraft(emptyDraft),
  };
  return <ComposeDraftContext value={state}>{children}</ComposeDraftContext>;
}

/** The new mail being written, from the `ComposeDraftProvider` around the app. */
export function useComposeDraft(): ComposeDraftState {
  const state = use(ComposeDraftContext);
  if (state === undefined) {
    throw new Error('useComposeDraft is used outside of a ComposeDraftProvider.');
  }
  return state;
}
