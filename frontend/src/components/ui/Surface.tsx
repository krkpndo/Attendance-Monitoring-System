import type { ReactNode } from "react";

/*
 * Surface — a container that knows its elevation.
 *
 * Before this, "a card" was 33 hand-typed copies of
 * `rounded-box border border-base-300 bg-base-100`, which is why nothing behind
 * the login screen ever looked lifted: there was no elevation concept at all,
 * just one flat recipe.
 *
 * The important part is that elevation has a DIFFERENT GRAMMAR per theme, and
 * this component is where that lives so no call site has to know it:
 *   - light lifts with a primary-tinted shadow,
 *   - dark lifts with a lighter surface step plus a brighter border, because a
 *     drop shadow is invisible against #10131C.
 * Both come out of the same token (`shadow-2` is a real shadow in light and an
 * inset highlight in dark), so `level={2}` is correct in both themes.
 *
 * Levels: "sunken" = a recessed well INSIDE a card (the all-time strip);
 * 1 = resting card; 2 = the one primary area on a screen; 3 = overlays.
 */
type Level = "sunken" | 1 | 2 | 3;

const LEVEL_CLASS: Record<string, string> = {
  sunken: "bg-surface-sunken border border-border-subtle",
  1: "bg-surface-card border border-border-subtle shadow-1",
  2: "bg-surface-raised border border-border-raised shadow-2",
  3: "bg-surface-overlay border border-border-raised shadow-3",
};

type SurfaceProps = {
  level?: Level;
  children: ReactNode;
  className?: string;
};

export function Surface({ level = 1, children, className = "" }: SurfaceProps) {
  return <div className={`rounded-box ${LEVEL_CLASS[String(level)]} ${className}`}>{children}</div>;
}
