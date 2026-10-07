import { useStudentClasses } from "../student.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDays, formatTime } from "@/lib/format";

/*
 * Classes — the student's enrolled classes, each with its meeting schedule.
 * Card grid rather than a table because each class carries nested schedule rows.
 */
export function StudentClassesPage() {
  const query = useStudentClasses();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">My Classes</h1>

      <DataState
        query={query}
        isEmpty={query.data?.length === 0}
        empty={<EmptyState title="Not enrolled in any classes" description="Once an admin enrolls you, your classes show up here." />}
      >
        {(enrollments) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {enrollments.map((e, i) => (
              <div key={e.class.id ?? i} className="rounded-box border border-base-300 bg-base-100 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-base-content">{e.class.course.courseCode}</div>
                    <div className="text-sm text-base-content/70">{e.class.course.courseName}</div>
                  </div>
                  {e.class.room && <span className="badge badge-ghost">{e.class.room}</span>}
                </div>

                <div className="mt-2 text-sm text-base-content/60">
                  {e.class.section} · {e.class.professor?.name ?? "Unassigned"}
                </div>

                <div className="mt-3 flex flex-col gap-1 border-t border-base-300 pt-3 text-sm">
                  {(e.class.classSchedules ?? []).length === 0 ? (
                    <span className="text-base-content/50">No schedule set</span>
                  ) : (
                    e.class.classSchedules!.map((s, si) => (
                      <div key={s.id ?? si} className="flex justify-between">
                        <span>{formatDays(s.dayOfWeek)}</span>
                        <span className="text-base-content/70">
                          {formatTime(s.startTime)} – {formatTime(s.endTime)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}
