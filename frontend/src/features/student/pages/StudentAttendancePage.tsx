import { useState } from "react";
import { useStudentAttendance } from "../student.queries";
import { DataState } from "@/components/ui/DataState";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatTime, formatTimestamp } from "@/lib/format";

/*
 * Attendance — the student's full paginated record. Page state lives here and
 * feeds the query key, so changing pages refetches (and TanStack Query caches
 * each page).
 */
export function StudentAttendancePage() {
  const [page, setPage] = useState(1);
  const query = useStudentAttendance({ page, limit: 15 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Attendance</h1>

      <DataState
        query={query}
        isEmpty={query.data?.items.length === 0}
        empty={<EmptyState title="No attendance records yet" description="Records appear once your professors open sessions." />}
      >
        {(data) => (
          <>
            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Course</th>
                    <th>Time</th>
                    <th>Checked in</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={`${r.sessionId}`}>
                      <td className="whitespace-nowrap">{formatDate(r.session.sessionDate)}</td>
                      <td>
                        <div className="font-medium">{r.session.class.course.courseCode}</div>
                        <div className="text-xs text-base-content/60">{r.session.class.course.courseName}</div>
                      </td>
                      <td className="whitespace-nowrap text-sm">
                        {formatTime(r.session.startTime)} – {formatTime(r.session.endTime)}
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
