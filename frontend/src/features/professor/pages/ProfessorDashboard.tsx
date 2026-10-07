import { Link } from "react-router";
import { useProfClasses, useProfProfile } from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDays, formatTime } from "@/lib/format";

/*
 * Overview — greeting + the professor's classes as entry points into class
 * management (roster / sessions / report all live under a class).
 */
export function ProfessorDashboard() {
  const profile = useProfProfile();
  const classes = useProfClasses();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">
          {profile.isPending ? <Skeleton className="h-8 w-48" /> : `Welcome, ${profile.data?.user.name ?? ""}`}
        </h1>
        {profile.data && (
          <p className="text-sm text-base-content/60">
            {profile.data.department} · {profile.data.position}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-base-content">Your classes</h2>
        <DataState
          query={classes}
          isEmpty={classes.data?.length === 0}
          empty={<EmptyState title="No classes assigned" description="An admin assigns classes to you; they'll appear here." />}
        >
          {(list) => (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {list.map((c) => (
                <Link
                  key={c.id}
                  to={`/professor/classes/${c.id}`}
                  className="rounded-box border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-base-content">{c.course.courseCode}</div>
                      <div className="text-sm text-base-content/70">{c.course.courseName}</div>
                    </div>
                    <span className="badge badge-ghost">{c._count?.classEnrollments ?? 0} enrolled</span>
                  </div>
                  <div className="mt-2 text-sm text-base-content/60">{c.section}</div>
                  <div className="mt-2 flex flex-col gap-0.5 text-xs text-base-content/60">
                    {(c.classSchedules ?? []).map((s, i) => (
                      <span key={i}>{formatDays(s.dayOfWeek)} · {formatTime(s.startTime)}–{formatTime(s.endTime)}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </DataState>
      </div>
    </div>
  );
}
