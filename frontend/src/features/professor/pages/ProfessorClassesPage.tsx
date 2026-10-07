import { Link } from "react-router";
import { useProfClasses } from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDays, formatTime } from "@/lib/format";

/*
 * Classes — the full list of assigned classes; each links to its detail page
 * (roster, sessions, report).
 */
export function ProfessorClassesPage() {
  const query = useProfClasses();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Classes</h1>

      <DataState
        query={query}
        isEmpty={query.data?.length === 0}
        empty={<EmptyState title="No classes assigned" />}
      >
        {(list) => (
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Schedule</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="hover">
                    <td>
                      <Link to={`/professor/classes/${c.id}`} className="font-medium text-primary hover:underline">
                        {c.course.courseCode}
                      </Link>
                      <div className="text-xs text-base-content/60">{c.course.courseName}</div>
                    </td>
                    <td>{c.section}</td>
                    <td className="text-sm">
                      {(c.classSchedules ?? []).map((s, i) => (
                        <div key={i}>{formatDays(s.dayOfWeek)} · {formatTime(s.startTime)}</div>
                      ))}
                    </td>
                    <td>{c._count?.classEnrollments ?? 0}</td>
                    <td>{c.status && <Badge>{c.status}</Badge>}</td>
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
