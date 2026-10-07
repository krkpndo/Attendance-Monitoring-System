/*
 * BrandMark — the product's mark, and deliberately a PLACEHOLDER.
 *
 * There is no authoritative logo asset in this repository. The purple favicon
 * in public/ is a template leftover and is not this product's identity; what
 * the brand actually consists of today is the wordmark as text, the
 * primary→secondary gradient, and the semantic palette.
 *
 * So this is a stand-in: a rounded square in the brand gradient holding a check
 * inside a ring. It is isolated in its own component precisely so that when an
 * institution supplies a real logo, it drops into this one file at the same
 * three sizes and nothing else in the app changes.
 *
 * Sizes: 32px in the mobile top bar, 36px in the sidebar, 40px in the rail.
 */
const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

export function BrandMark({ size = "sm" }: { size?: keyof typeof SIZE_CLASS }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-field bg-linear-to-br from-primary to-secondary text-primary-content ${SIZE_CLASS[size]}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={1.75} opacity={0.55} />
        <path
          d="m8.5 12.2 2.6 2.6 4.6-5"
          stroke="currentColor"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/*
 * Wordmark — "Attendance" with the role beneath it. Never renders the raw enum
 * (the old shell showed a badge that literally read "STUDENT").
 */
export function Wordmark({ role, className = "" }: { role: string; className?: string }) {
  return (
    <span className={`min-w-0 leading-tight ${className}`}>
      <span className="block truncate text-base font-bold text-strong">Attendance</span>
      <span className="block truncate text-xs text-muted">{role}</span>
    </span>
  );
}
