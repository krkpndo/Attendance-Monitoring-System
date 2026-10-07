import { StatusBadge, type DisplayStatus } from "./StatusBadge";

/*
 * StatTile — one all-time total: a status badge and its count.
 *
 * Deliberately dumb. It shows the number the API returned and nothing else: no
 * percentage, no proportion bar, no comparison. The four all-time totals are
 * the most trustworthy figures on the dashboard precisely because they need no
 * interpretation, and combining them into a rate here would quietly invent a
 * metric the backend does not expose.
 */
export function StatTile({ status, value }: { status: DisplayStatus; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <StatusBadge status={status} hideLabel />
      <div className="min-w-0 leading-tight">
        <div className="text-xl font-bold text-strong">{value}</div>
        <div className="truncate text-xs text-muted">{labelOf(status)}</div>
      </div>
    </div>
  );
}

function labelOf(status: DisplayStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
