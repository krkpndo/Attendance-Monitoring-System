import type { ReactNode } from "react";

/*
 * EmptyState — the "there's genuinely nothing here" view.
 *
 * §3 says empty is a real design case, not an afterthought: explain WHY it's
 * empty and, where it makes sense, offer the primary action that resolves it
 * (e.g. "No attendance records yet" + an "Open a session" button). The `action`
 * slot is a children slot rather than a pile of button props (composition over
 * configuration — §4).
 */
type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;      // optional illustration/glyph
  action?: ReactNode;    // e.g. <Button>…</Button>
};

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center">
      {icon && <div className="text-base-content/40">{icon}</div>}

      <h3 className="text-base font-medium text-base-content">{title}</h3>

      {description && (
        <p className="max-w-sm text-sm text-base-content/60">{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
