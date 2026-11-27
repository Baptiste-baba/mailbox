import { type ReactNode, useLayoutEffect, useRef } from 'react';

interface SidePanelProps {
  open: boolean;
  /** Asked to close: by Escape, the back button of the phone, or a touch beside the panel. */
  onClose: () => void;
  /** Name of the panel, read aloud. */
  label: string;
  /** Name of the dimmed page beside the panel, which closes it. */
  closeLabel: string;
  children: ReactNode;
}

/**
 * A panel sliding in from the left over the page, dimmed beside it, on the native `<dialog>`: the
 * keyboard stays inside while it is open, and comes back to where it was once it closes. Unlike a
 * dialog, a touch beside it closes it: nothing is typed in it that could be lost. Its content is
 * only there while it is open.
 */
export function SidePanel({ open, onClose, label, closeLabel, children }: SidePanelProps) {
  const panelRef = useRef<HTMLDialogElement>(null);
  // Before the page is painted: the content goes with the panel, never shown without it.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (open && panel?.open === false) {
      panel.showModal();
    } else if (!open && panel?.open === true) {
      panel.close();
    }
  }, [open]);
  return (
    <dialog
      ref={panelRef}
      aria-label={label}
      // Escape and the back button ask, as a touch beside does: the app decides when it closes.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 size-full max-h-none max-w-none bg-transparent p-0 backdrop:bg-transparent"
    >
      {open && (
        <div className="flex h-full">
          <div className="h-full w-77 max-w-[85vw] flex-none rounded-r-xl bg-chrome text-ink shadow-card motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:starting:-translate-x-full">
            {children}
          </div>
          {/* The dimmed page: a button of its own, so that it closes the panel from any input. */}
          <button
            type="button"
            aria-label={closeLabel}
            tabIndex={-1}
            onClick={onClose}
            className="flex-1 bg-scrim motion-safe:transition-opacity motion-safe:duration-200 motion-safe:starting:opacity-0"
          />
        </div>
      )}
    </dialog>
  );
}
