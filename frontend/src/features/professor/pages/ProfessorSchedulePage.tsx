import { useMemo } from "react";
import { useProfSchedule } from "../professor.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { dayName, formatTime } from "@/lib/format";
import type { WeeklyScheduleItem } from "../professor.schema";

/*
 * Weekly teaching timetable — every active class's schedule slots, grouped by
 * weekday. A single class slot can span several days (dayOfWeek is an array), so
 * we fan each slot out into one entry per day, then sort each day by start time.
 * Display-only: the backend omits class IDs here, so nothing links out.
 */
type Entry = { start: string; end: string; item: WeeklyScheduleItem };

export function ProfessorSchedulePage() {
  const query = useProfSchedule();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-base-content">Weekly Schedule</h1>

      <DataState query={query} isEmpty={query.data?.length === 0} empty={<EmptyState title="No schedule" description="No active class has a schedule assigned yet." />}>
        {(slots) => <Timetable slots={slots} />}
      </DataState>
    </div>
  );
}

function Timetable({ slots }: { slots: WeeklyScheduleItem[] }) {
  // Bucket every (slot × day) into its weekday, Mon-first (1..6, then 0=Sun).
  const byDay = useMemo(() => {
    const days: Entry[][] = [[], [], [], [], [], [], []];
    for (const item of slots)
      for (const d of item.dayOfWeek)
        days[d]?.push({ start: item.startTime, end: item.endTime, item });
    for (const list of days) list.sort((a, b) => a.start.localeCompare(b.start));
    return days;
  }, [slots]);

  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {order.map((d) => {
        const entries = byDay[d] ?? [];
        return (
          <div key={d} className="rounded-box border border-base-300 bg-base-100 p-4">
            <h2 className="mb-3 font-semibold text-base-content">{dayName(d)}</h2>
            {entries.length === 0 ? (
              <p className="text-sm text-base-content/40">No classes.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {entries.map((e, i) => (
                  <li key={i} className="rounded-box border border-base-300 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-medium">{e.item.class.course.courseCode}</span>
                      <span className="text-xs text-base-content/60">{formatTime(e.start)}–{formatTime(e.end)}</span>
                    </div>
                    <div className="mt-1 text-xs text-base-content/70">
                      {e.item.class.course.courseName} · {e.item.class.section}
                      {e.item.class.room ? ` · ${e.item.class.room}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
