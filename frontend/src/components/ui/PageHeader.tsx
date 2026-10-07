import type { ReactNode } from "react";

/*
 * PageHeader — the one page-title pattern.
 *
 * Every authenticated page had been hand-rolling
 * `<h1 className="text-2xl font-bold text-base-content">` (31 copies), each
 * with its own spacing and its own idea of where a back link or an action
 * button goes. This makes the page title a single decision.
 *
 * Slots rather than props: `eyebrow` carries the dashboard's greeting above the
 * name, `meta` the identity line beneath it, `actions` anything trailing. A
 * page that needs none of them just passes a title.
 *
 * The title clamps to two lines — a long full name must not push the content
 * down the screen or overlap the actions.
 */
type PageHeaderProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, eyebrow, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-sm text-muted">{eyebrow}</p>}
        <h1 className="line-clamp-2 text-2xl font-bold tracking-[-0.01em] text-strong">{title}</h1>
        {meta && <div className="mt-1 text-sm text-muted">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
