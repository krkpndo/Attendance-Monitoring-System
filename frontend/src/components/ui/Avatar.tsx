import { UserIcon } from "./icons";

/*
 * Avatar — the student's photo, their initials, or a neutral placeholder.
 *
 * The shell must look complete BEFORE the profile request resolves, because the
 * auth session carries only { id, type, status } — no name and no photo. So
 * "loading" is a real, designed state here rather than an absence, and every
 * variant occupies exactly the same box so nothing shifts when data lands.
 *
 * Three states, in the order they actually occur:
 *   pending/failed → neutral disc with a person glyph
 *   loaded, no profileImage → initials on a primary tint
 *   loaded with a photo → the photo
 */
const SIZE_CLASS = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZE_CLASS;
};

export function Avatar({ name, src, size = "sm" }: AvatarProps) {
  const box = `${SIZE_CLASS[size]} shrink-0 overflow-hidden rounded-full`;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`${box} object-cover ring-1 ring-border-subtle`}
      />
    );
  }

  const initials = name ? initialsOf(name) : "";

  if (initials) {
    return (
      <span
        aria-hidden="true"
        className={`${box} grid place-items-center bg-tint-primary font-bold text-strong`}
      >
        {initials}
      </span>
    );
  }

  // No name yet (pending or failed) — neutral, same footprint.
  return (
    <span
      aria-hidden="true"
      className={`${box} grid place-items-center bg-surface-sunken text-subtle ring-1 ring-border-subtle`}
    >
      <UserIcon className="h-1/2 w-1/2" />
    </span>
  );
}
