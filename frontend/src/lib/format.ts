/*
 * Formatting helpers.
 *
 * CRITICAL tz note (mirrors the backend): schedule/session `startTime`/`endTime`
 * are Postgres @db.Time and `sessionDate` is @db.Date. They serialize as ISO
 * strings whose UTC portion holds the literal wall-clock value (e.g.
 * "1970-01-01T08:00:00.000Z" == 8:00 AM). They must be read with UTC getters, or
 * they shift by the viewer's timezone offset. Real instants (createdAt, timeIn,
 * submittedAt) are genuine timestamps and display fine in local time.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** @db.Time → "8:00 AM" (UTC wall-clock). */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** @db.Date → "Mar 17, 2026" (UTC, so no off-by-one at day boundaries). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Real timestamp (createdAt, timeIn) → local date + time. */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayName(index: number, short = false): string {
  return (short ? DAYS_SHORT : DAYS)[index] ?? String(index);
}

/** dayOfWeek arrays like [1,3,5] → "Mon, Wed, Fri". */
export function formatDays(days: number[]): string {
  return days.map((d) => dayName(d, true)).join(", ");
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
