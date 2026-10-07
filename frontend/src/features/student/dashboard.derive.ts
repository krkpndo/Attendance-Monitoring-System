import type { StudentAttendanceRecord, StudentScheduleItem } from "./student.schema";

/*
 * Pure derivations for the student dashboard.
 *
 * The backend exposes only all-time totals (no monthly/weekly aggregation), so
 * the dashboard pulls one year of attendance records and aggregates them here.
 * Everything is a pure function of (records, now) → easy to reason about, no
 * fabricated data.
 *
 * Timezone note (mirrors lib/format): session.sessionDate is @db.Date and
 * startTime is @db.Time — their UTC portion holds the intended wall-clock value,
 * so we read calendar parts with getUTC*. "Today"/"this week" are the viewer's
 * local calendar, so those bounds come from local getters. Both sides compare as
 * YYYY-MM-DD strings, which sidesteps any offset math.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function ymdUTC(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** @db.Time ISO → minutes since midnight (UTC wall-clock). */
function timeMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** ISO date bounds for the current week, Monday→Sunday, in the local calendar. */
export function weekRange(now = new Date()): { start: string; end: string } {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // getDay 0=Sun
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: ymdLocal(monday), end: ymdLocal(sunday) };
}

/** First day of the current year and today, as YYYY-MM-DD (the fetch range). */
export function yearRange(now = new Date()): { start: string; end: string } {
  return { start: `${now.getFullYear()}-01-01`, end: ymdLocal(now) };
}

export type MonthPoint = {
  month: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
};

/** Bucket this year's records by month, up to and including the current month. */
export function monthlyTrend(records: StudentAttendanceRecord[], now = new Date()): MonthPoint[] {
  const year = now.getFullYear();
  const upto = now.getMonth();
  const buckets: MonthPoint[] = [];
  for (let m = 0; m <= upto; m++) {
    buckets.push({ month: MONTHS[m] ?? "", total: 0, present: 0, late: 0, absent: 0, excused: 0 });
  }
  for (const r of records) {
    const d = new Date(r.session.sessionDate);
    if (d.getUTCFullYear() !== year) continue;
    const b = buckets[d.getUTCMonth()];
    if (!b) continue;
    b.total++;
    if (r.status === "PRESENT") b.present++;
    else if (r.status === "LATE") b.late++;
    else if (r.status === "ABSENT") b.absent++;
    else if (r.status === "EXCUSED") b.excused++;
  }
  return buckets;
}

export type StatusKey = "present" | "late" | "absent" | "excused";

/** Per-month counts of one status → a sparkline series. */
export function sparkline(trend: MonthPoint[], key: StatusKey): number[] {
  return trend.map((p) => p[key]);
}

/** This week's present-count / total, for the hero donut. */
export function weekStats(records: StudentAttendanceRecord[], now = new Date()): { present: number; total: number; pct: number } {
  const { start, end } = weekRange(now);
  let present = 0;
  let total = 0;
  for (const r of records) {
    const ymd = ymdUTC(r.session.sessionDate);
    if (ymd < start || ymd > end) continue;
    total++;
    if (r.status === "PRESENT") present++;
  }
  return { present, total, pct: total === 0 ? 0 : Math.round((present / total) * 100) };
}

export type TodayEntry = {
  key: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  section: string;
  room: string | null | undefined;
  /** A real attendance status if a record exists, else a derived schedule state. */
  status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED" | "UPCOMING" | "PENDING";
  /** When the tap was stamped, if one was. Null when no record exists yet. */
  timeIn: string | null | undefined;
};

/**
 * Today's classes from the weekly schedule, joined to today's attendance records
 * (matched by course+section). No record yet → UPCOMING if the class hasn't
 * started, otherwise PENDING (session not opened / not recorded).
 */
export function todaySchedule(
  schedule: StudentScheduleItem[],
  records: StudentAttendanceRecord[],
  now = new Date(),
): TodayEntry[] {
  const todayDow = now.getDay();
  const todayYmd = ymdLocal(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const recByKey = new Map<string, StudentAttendanceRecord>();
  for (const r of records) {
    if (ymdUTC(r.session.sessionDate) !== todayYmd) continue;
    recByKey.set(`${r.session.class.course.courseCode}|${r.session.class.section}`, r);
  }

  return schedule
    .filter((s) => s.dayOfWeek.includes(todayDow))
    .map((s) => {
      const key = `${s.class.course.courseCode}|${s.class.section}`;
      const rec = recByKey.get(key);
      const status: TodayEntry["status"] = rec
        ? rec.status
        : timeMinutes(s.startTime) > nowMin
          ? "UPCOMING"
          : "PENDING";
      return {
        key: s.id ?? key,
        startTime: s.startTime,
        endTime: s.endTime,
        courseCode: s.class.course.courseCode,
        courseName: s.class.course.courseName,
        section: s.class.section,
        room: s.class.room,
        status,
        timeIn: rec?.timeIn ?? null,
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
