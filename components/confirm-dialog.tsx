"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button for a destructive action (red). */
  destructive?: boolean;
  /** Disable the confirm button (e.g. while the action is pending). */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * An in-app modal confirmation dialog, replacing the native window.confirm().
 *
 * Built on the native <dialog> element so we get a focus trap, Escape-to-close,
 * and an inert background for free, then styled to match FamilyPulse. Render it
 * controlled via `open`; the parent owns the boolean.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement | null>(null);

  // Keep the native dialog's open state in sync with the controlled prop.
  // showModal() gives us the backdrop + focus trap; close() tears it down.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      // The native "cancel" event fires on Escape and on backdrop-dismiss.
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      // Clicking the backdrop (the dialog element itself, outside the panel).
      onClick={(event) => {
        if (event.target === ref.current && !busy) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-fp-line bg-white p-0 shadow-card backdrop:bg-fp-ink/40 backdrop:backdrop-blur-sm"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              destructive ? "bg-red-100 text-red-600" : "bg-fp-mint text-fp-green"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-fp-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm font-semibold leading-6 text-fp-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-fp-muted hover:bg-fp-line/40 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-fp-line bg-white px-4 text-sm font-extrabold text-fp-ink shadow-soft hover:border-fp-green hover:text-fp-green disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-extrabold !text-white shadow-green disabled:opacity-60 ${
              destructive ? "bg-red-600 shadow-none" : "bg-fp-green"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
