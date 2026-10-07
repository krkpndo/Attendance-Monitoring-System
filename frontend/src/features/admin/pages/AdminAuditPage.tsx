import { useState } from "react";
import { useAdminAudit } from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatTimestamp } from "@/lib/format";

/*
 * Audit logs — the privileged-action trail, paginated, newest first. Optional
 * date range (backend requires both together).
 */
export function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const both = !!startDate === !!endDate;
  const query = useAdminAudit(
    startDate && endDate ? { page, limit: 20, startDate, endDate } : { page, limit: 20 },
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Audit Logs</h1>

      <div className="flex flex-wrap items-end gap-3">
        <label className="form-control">
          <span className="label-text mb-1">From</span>
          <input type="date" className="input input-bordered input-sm" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
        </label>
        <label className="form-control">
          <span className="label-text mb-1">To</span>
          <input type="date" className="input input-bordered input-sm" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
        </label>
        {!both && <span className="text-xs text-warning self-center">Set both dates or neither.</span>}
      </div>

      <DataState
        query={query}
        isEmpty={query.data?.items.length === 0}
        empty={<EmptyState title="No audit entries" />}
      >
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table table-sm">
                <thead>
                  <tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr>
                </thead>
                <tbody>
                  {data.items.map((l) => (
                    <tr key={l.id}>
                      <td className="whitespace-nowrap">{formatTimestamp(l.createdAt)}</td>
                      <td>{l.user ? `${l.user.name} (${l.user.type})` : "—"}</td>
                      <td><span className="badge badge-ghost badge-sm">{l.action}</span></td>
                      <td className="text-sm">{l.entityType}</td>
                      <td className="max-w-xs truncate text-sm text-base-content/70">{l.description ?? "—"}</td>
                      <td className="font-mono text-xs">{l.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>
    </div>
  );
}
