import { useState } from "react";
import { Link } from "react-router";
import { useExcuseLetters } from "../student.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { SubmitExcuseModal } from "../components/SubmitExcuseModal";
import { formatDate } from "@/lib/format";

/*
 * Excuse Letters — list of submitted letters + the submit flow. Each row links
 * to a detail page (per-date review status lives there). "Submit" opens the
 * modal; on success the list is invalidated by the mutation and refetches.
 */
export function StudentExcusesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const query = useExcuseLetters();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-base-content">Excuse Letters</h1>
        <Button onClick={() => setModalOpen(true)}>Submit excuse</Button>
      </div>

      <DataState
        query={query}
        isEmpty={query.data?.length === 0}
        empty={
          <EmptyState
            title="No excuse letters yet"
            description="Submitted an absence you couldn't help? File an excuse and track its review here."
            action={<Button onClick={() => setModalOpen(true)}>Submit excuse</Button>}
          />
        }
      >
        {(letters) => (
          <div className="flex flex-col gap-3">
            {letters.map((l) => {
              const courses = [
                ...new Set(l.excuseDates.map((d) => d.attendanceRecord.session.class.course.courseCode)),
              ].join(", ");
              return (
                <Link
                  key={l.id}
                  to={`/student/excuses/${l.id}`}
                  className="rounded-box border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge badge-outline">{l.excuseType.replace("_", " ")}</span>
                    <span className="text-xs text-base-content/50">{formatDate(l.submittedAt)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-base-content/80">{l.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-base-content/60">
                    <span>{courses || "—"}</span>
                    <span>· {l.excuseDates.length} date(s)</span>
                    <span>· {l._count.attachments} attachment(s)</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </DataState>

      <SubmitExcuseModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
