import { useState } from "react";
import { useAdminAttendance } from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatTime, formatTimestamp } from "@/lib/format";

/*
 * Attendance oversight — every attendance record across all classes, paginated.
 * The backend requires startDate/endDate together, so we only send them when
 * both are set.
 */
export function AdminAttendancePage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const bothOrNeither = (!!startDate === !!endDate);
  const filters = { page, limit: 20, ...(startDate && endDate ? { startDate, endDate } : {}) };
  const query = useAdminAttendance(bothOrNeither ? filters : { page, limit: 20 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Attendance Oversight</h1>

      <div className="flex flex-wrap items-end gap-3">
        <label className="form-control">
          <span className="label-text mb-1">From</span>
          <input type="date" className="input input-bordered input-sm" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
        </label>
        <label className="form-control">
          <span className="label-text mb-1">To</span>
          <input type="date" className="input input-bordered input-sm" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
        </label>
        {!bothOrNeither && <span className="text-xs text-warning self-center">Set both dates or neither.</span>}
      </div>

      <DataState
        query={query}
        isEmpty={query.data?.items.length === 0}
        empty={<EmptyState title="No records" description="No attendance matches the current filter." />}
      >
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table table-sm">
                <thead>
                  <tr><th>Date</th><th>Student</th><th>Course</th><th>Time in</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.items.map((r, i) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap">{formatDate(r.session.sessionDate)}</td>
                      <td>{r.student.name}</td>
                      <td>
                        <div className="font-medium">{r.session.class.course.courseCode}</div>
                        <div className="text-xs text-base-content/60">{r.session.class.section}</div>
                      </td>
                      <td className="whitespace-nowrap text-sm">{r.timeIn ? formatTimestamp(r.timeIn) : "—"}</td>
                      <td><Badge>{r.status}</Badge></td>
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
