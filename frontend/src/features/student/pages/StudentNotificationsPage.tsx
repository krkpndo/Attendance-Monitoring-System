import { useState } from "react";
import { useMarkNotificationRead, useNotifications } from "../student.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatTimestamp } from "@/lib/format";

/*
 * Notifications — paginated list. Unread rows are visually distinct (a left
 * accent + dot) and clicking one marks it read. The mutation invalidates the
 * student cache so the list reflects the new read state.
 */
export function StudentNotificationsPage() {
  const [page, setPage] = useState(1);
  const query = useNotifications({ page, limit: 15 });
  const markRead = useMarkNotificationRead();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Notifications</h1>

      <DataState
        query={query}
        isEmpty={query.data?.items.length === 0}
        empty={<EmptyState title="You're all caught up" description="Absence alerts and excuse updates will show up here." />}
      >
        {(data) => (
          <>
            <div className="flex flex-col gap-2">
              {data.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                  className={`rounded-box border p-4 text-left transition-colors ${
                    n.isRead
                      ? "border-base-300 bg-base-100"
                      : "border-l-4 border-l-primary border-base-300 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium text-base-content">
                      {!n.isRead && <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                      {n.title}
                    </span>
                    <span className="text-xs text-base-content/50">{formatTimestamp(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-base-content/70">{n.message}</p>
                </button>
              ))}
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>
    </div>
  );
}
