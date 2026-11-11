import { XIcon } from 'lucide-react';
import { type ReactNode, useId, useLayoutEffect, useRef } from 'react';
import { Alert } from './alert.tsx';
import { Button } from './button.tsx';
import { IconButton } from './icon-button.tsx';

interface DialogProps {
  open: boolean;
  /** Asked to close: by the close button or Escape. The dialog closes once `open` turns false. */
  onClose: () => void;
  title: string;
  /** Name of the close button, read aloud and shown on hover. */
  closeLabel: string;
  children: ReactNode;
}

/**
 * A modal dialog over the page, dimmed behind it, on the native `<dialog>`: the keyboard stays
 * inside while it is open, and comes back to where it was once it closes. Its content is only
 * there while it is open, so that it starts afresh each time. Clicking outside does not close it:
 * what was typed in it would be lost.
 */
export function Dialog({ open, onClose, title, closeLabel, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Before the page is painted: the content goes with the dialog, never shown without it.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog?.open === false) {
      dialog.showModal();
    } else if (!open && dialog?.open === true) {
      dialog.close();
    }
  }, [open]);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Escape asks, as the close button does: the app decides when the dialog closes.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-120 rounded-xl border border-line bg-surface text-ink shadow-card backdrop:bg-scrim"
    >
      {open && (
        <>
          <header className="flex items-center justify-between gap-4 border-b border-line py-2 pr-2.5 pl-6">
            <h2 id={titleId} className="font-semibold text-body text-heading">
              {title}
            </h2>
            <IconButton label={closeLabel} onClick={onClose}>
              <XIcon />
            </IconButton>
          </header>
          <div className="px-6 py-6">{children}</div>
        </>
      )}
    </dialog>
  );
}

/** The buttons at the foot of a dialog, across its whole width, the main one first. */
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex flex-col gap-3 [&>button]:w-full">{children}</div>;
}

interface DialogConfirmationProps {
  /** What the action does, and what follows from it. */
  message: string;
  /** Why the action failed, if it did. */
  error: string | undefined;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** The action is on its way: it cannot be asked twice. */
  pending: boolean;
}

/**
 * The content of a dialog asking before an action that cannot be undone: what it does, then the
 * red action and the way back.
 */
export function DialogConfirmation({
  message,
  error,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  pending,
}: DialogConfirmationProps) {
  return (
    <>
      <p className="text-center text-ink-2">{message}</p>
      {error !== undefined && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
      <DialogActions>
        <Button variant="danger" size="lg" onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" size="lg" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </DialogActions>
    </>
  );
}
