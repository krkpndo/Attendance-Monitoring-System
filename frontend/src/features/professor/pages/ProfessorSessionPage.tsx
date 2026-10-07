import { Link, useParams } from "react-router";
import { useMarkAttendance, useSessionRecords } from "../professor.queries";
import { attendanceStatusSchema } from "@/lib/enums";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatTimestamp } from "@/lib/format";

/*
 * Session attendance — the roster for one session with per-student status. A
 * professor overrides a status via the inline <select>; changing it marks the
 * record (isManual) and the row refetches. A manual override is flagged so it's
 * clear a later RFID tap won't overwrite it.
 */
const STATUSES = attendanceStatusSchema.options;

export function ProfessorSessionPage() {
  const { sessionId = "" } = useParams();
  const query = useSessionRecords(sessionId);
  const mark = useMarkAttendance(sessionId);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/professor/classes" className="text-sm text-primary hover:underline">← Back to classes</Link>
      <h1 className="text-2xl font-bold text-base-content">Session attendance</h1>

      <DataState
        query={query}
        isEmpty={query.data?.length === 0}
        empty={<EmptyState title="No records" description="This session has no enrolled students." />}
      >
        {(records) => (
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Checked in</th><th>Status</th><th>Override</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">
                      {r.student.name}
                      {r.isManual && <span className="ml-2 badge badge-ghost badge-sm">manual</span>}
                    </td>
                    <td className="text-sm text-base-content/70">{r.timeIn ? formatTimestamp(r.timeIn) : "—"}</td>
                    <td><Badge>{r.status}</Badge></td>
                    <td>
                      <select
                        className="select select-bordered select-sm"
                        value={r.status}
                        disabled={mark.isPending}
                        onChange={(e) => mark.mutate({ recordId: r.id, body: { status: e.target.value as (typeof STATUSES)[number] } })}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
