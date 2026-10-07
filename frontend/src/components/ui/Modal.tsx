import { useEffect, useRef, type ReactNode } from "react";

/*
 * Modal — a focused dialog. Per §2 it's for "confirm before it happens"
 * (destructive confirmations) and quick, contained tasks (a short form). Long or
 * complex flows should be a page instead — modals shouldn't become mini-pages.
 *
 * Built on the native <dialog> element, which gives us focus trapping, Esc-to-
 * close, and the ::backdrop for free — accessibility we'd otherwise hand-roll.
 */
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode; // footer buttons
};

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Drive the native dialog from the `open` prop.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose}>
      <div className="modal-box">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm btn-circle"
          >
            ✕
          </button>
        </div>

        {children}

        {actions && <div className="modal-action">{actions}</div>}
      </div>

      {/* Click-outside closes. The <form method="dialog"> pattern is daisyUI's. */}
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  );
}
