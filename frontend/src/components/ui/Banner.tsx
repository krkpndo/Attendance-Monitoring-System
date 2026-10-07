import type { ReactNode } from "react";

/*
 * Banner — a persistent, in-flow alert. Per §2 this is the "this is still true"
 * pattern: page/section-level state the user should keep seeing until it's
 * resolved (e.g. "your session will expire soon", or a request-level error that
 * blocks the view). It does NOT auto-dismiss like a toast.
 *
 * Each variant pairs a color with an ICON (§5: color is never the only signal),
 * so the meaning survives a fast glance or color-blindness.
 */
type Variant = "info" | "success" | "warning" | "error";

const VARIANT_CLASS: Record<Variant, string> = {
  info: "alert-info",
  success: "alert-success",
  warning: "alert-warning",
  error: "alert-error",
};

// Minimal inline SVGs so we don't pull in an icon dependency yet. currentColor
// makes them inherit the alert's content color automatically.
const ICON: Record<Variant, ReactNode> = {
  info: <path d="M12 16v-4M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  success: <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  warning: <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14A2 2 0 003.83 21h16.34a2 2 0 001.72-3.14l-8.18-14a2 2 0 00-3.42 0z" />,
  error: <path d="M12 8v4M12 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

type BannerProps = {
  variant?: Variant;
  children: ReactNode;
  onDismiss?: () => void;   // omit for a non-dismissible banner
};

export function Banner({ variant = "info", children, onDismiss }: BannerProps) {
  return (
    <div role="alert" className={`alert ${VARIANT_CLASS[variant]}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICON[variant]}
      </svg>

      <span className="text-sm">{children}</span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="btn btn-ghost btn-xs btn-circle"
        >
          ✕
        </button>
      )}
    </div>
  );
}
