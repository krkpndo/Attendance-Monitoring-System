/*
 * Skeleton — a shaped placeholder for initial loads.
 *
 * §3 prefers skeletons over spinners for full page/section loads: they match the
 * eventual layout, so there's no jarring layout shift when data arrives, and the
 * screen feels faster. Drive these off TanStack Query's `isPending` (no data yet)
 * — NOT off `isFetching`, or you'd re-skeleton a screen that already has content
 * during a background refetch.
 *
 * It's deliberately just a styled box: compose several to mimic the real layout
 * (e.g. a few stacked lines for a card, a grid of them for a table).
 */
type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  // daisyUI's `skeleton` class provides the shimmer + base-300 background,
  // which is already theme-aware in both light and dark.
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
