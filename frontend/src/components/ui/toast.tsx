import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastApi } from "./toast-context";

/*
 * Toast system — the "it happened" feedback from §2 (transient, non-blocking,
 * auto-dismiss). One provider at the app root owns the stack; anything can fire
 * a toast via useToast().
 *
 * Why a context instead of a per-page component: a mutation hook (e.g.
 * useSubmitExcuse) needs to announce success from deep in the tree without the
 * page wiring it up each time. Context gives every hook a toast.success(...) call.
 */
type ToastVariant = "success" | "error" | "info" | "warning";
type ToastItem = { id: number; variant: ToastVariant; message: string };

const ALERT_CLASS: Record<ToastVariant, string> = {
  success: "alert-success",
  error: "alert-error",
  info: "alert-info",
  warning: "alert-warning",
};

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, variant, message }]);
      // Errors linger longer than the default; they matter more.
      window.setTimeout(() => remove(id), variant === "error" ? AUTO_DISMISS_MS + 2000 : AUTO_DISMISS_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
      warning: (m) => push("warning", m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* aria-live so screen readers announce toasts as they appear. */}
      <div className="toast toast-top toast-end z-50" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${ALERT_CLASS[t.variant]} shadow-lg`}>
            <span className="text-sm">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              className="btn btn-ghost btn-xs btn-circle"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
