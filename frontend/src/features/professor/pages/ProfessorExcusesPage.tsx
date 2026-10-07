import { useState } from "react";
import { Link } from "react-router";
import { useProfExcuses } from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";

/*
 * Excuse letters for the professor's classes (paginated). Each row shows the
 * overall state (PENDING if any covered date still needs review) and links to
 * the detail page where the actual approve/reject happens.
 */
export function ProfessorExcusesPage() {
  const [page, setPage] = useState(1);
  const query = useProfExcuses({ page, limit: 15 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Excuse Letters</h1>

      <DataState
        query={query}
        isEmpty={query.data?.items.length === 0}
        empty={<EmptyState title="No excuse letters" description="Excuses your students submit for your classes appear here." />}
      >
        {(data) => (
          <>
            <div className="flex flex-col gap-3">
              {data.items.map((l) => {
                const pending = l.excuseDates.some((d) => d.status === "PENDING" || d.status === undefined);
                const courses = [...new Set(l.excuseDates.map((d) => d.attendanceRecord.session.class.course.courseCode))].join(", ");
                return (
                  <Link key={l.id} to={`/professor/excuses/${l.id}`} className="rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-base-content">{l.student.name}</span>
                      <Badge>{pending ? "PENDING" : "REVIEWED"}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-base-content/70">{l.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-base-content/60">
                      <span className="badge badge-outline badge-sm">{l.excuseType.replace("_", " ")}</span>
                      <span>{courses}</span>
                      <span>· {formatDate(l.submittedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Pagination meta={data.pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>
    </div>
  );
}
