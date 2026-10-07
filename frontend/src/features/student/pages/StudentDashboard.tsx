import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import {
  useAttendanceSummary,
  useStudentAttendanceRange,
  useStudentProfile,
  useStudentSchedule,
} from "../student.queries";
import { greeting, todaySchedule, weekRange, weekStats, type TodayEntry } from "../dashboard.derive";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { Skeleton } from "@/components/ui/Skeleton";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatTile } from "@/components/ui/StatTile";
import { BookIcon, CalendarIcon, CardIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { formatTime, dayName } from "@/lib/format";

/*
 * Student Overview.
 *
 * ONE primary area: Today's Classes. Students open this between classes to
 * confirm a tap registered, so the screen leads with time, course, room and
 * what was recorded. The two summaries below it are reference, not a verdict.
 *
 * Four requests drive it — profile, schedule, this week's attendance records,
 * and the all-time summary — and none blocks another: each section shows its
 * own skeleton, its own error and its own Retry. The week's records serve two
 * purposes (today's rows and the weekly counts), so they're fetched once.
 *
 * On the weekly figure, deliberately the smallest thing here: see the long note
 * above <ThisWeek/>.
 */
export function StudentDashboard() {
  // Frozen at mount. The dashboard is a glance, not a live clock, and a Date
  // recreated each render would change every query key and memo dependency.
  const now = useMemo(() => new Date(), []);
  // weekRange() speaks {start,end}; the range hook speaks the API's
  // {startDate,endDate}. Memoized so the query key is stable across renders.
  const week = useMemo(() => {
    const { start, end } = weekRange(now);
    return { startDate: start, endDate: end };
  }, [now]);

  const profile = useStudentProfile();
  const schedule = useStudentSchedule();
  // One query, two consumers: today's rows AND the weekly counts. It drains
  // every page of the range — /student/attendance caps a PAGE at 100 rows, not
  // the result set, and a truncated week would quietly skew weekStats().
  const attendance = useStudentAttendanceRange(week);
  const summary = useAttendanceSummary();

  const records = attendance.data;

  const todayRows = useMemo(
    () => (schedule.data && records ? todaySchedule(schedule.data, records, now) : []),
    [schedule.data, records, now],
  );
  const thisWeek = useMemo(() => (records ? weekStats(records, now) : null), [records, now]);

  // Derived, never stored: "verified" means "has an ACTIVE card". The endpoint
  // returns ACTIVE cards only, so this is active-or-none — never "revoked".
  const hasActiveCard = (profile.data?.rfidCards ?? []).some((card) => card.status === "ACTIVE");

  const totals = summary.data;
  const firstUse = totals ? totals.present + totals.late + totals.absent + totals.excused === 0 : false;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        eyebrow={greeting(now)}
        title={
          profile.isPending ? (
            <Skeleton className="h-8 w-56" />
          ) : profile.isError ? (
            "Overview"
          ) : (
            (profile.data?.user.name ?? "Overview")
          )
        }
        meta={
          profile.isError ? (
            <span className="inline-flex items-center gap-2">
              <span>Couldn't load your profile.</span>
              <button
                type="button"
                onClick={() => profile.refetch()}
                className="font-medium text-link underline underline-offset-2"
              >
                Retry
              </button>
            </span>
          ) : profile.isPending ? (
            <Skeleton className="h-4 w-44" />
          ) : profile.data ? (
            <span>
              <span className="font-mono">{profile.data.studentNumber}</span>
              {" · "}
              {profile.data.program} {profile.data.yearLevel}-{profile.data.section}
            </span>
          ) : null
        }
        actions={hasActiveCard ? <CardVerifiedChip /> : undefined}
      />

      {/* Persistent page-level condition → a banner, not a toast. */}
      {profile.data && !hasActiveCard && (
        <Banner variant="warning">
          <span>
            You don't have an active RFID card, so taps can't be recorded.{" "}
            <Link to="/student/rfid" className="font-medium underline underline-offset-2">
              Register or request a card
            </Link>
            .
          </span>
        </Banner>
      )}

      {/* xl splits into two columns; everything below md is one column. */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start">
        <TodaysClasses
          rows={todayRows}
          isPending={schedule.isPending || attendance.isPending}
          isError={schedule.isError || attendance.isError}
          isRefetching={attendance.isFetching && !attendance.isPending}
          hasNoEnrollment={schedule.data?.length === 0}
          weekday={dayName(now.getDay())}
          onRetry={() => {
            if (schedule.isError) schedule.refetch();
            if (attendance.isError) attendance.refetch();
          }}
        />

        <div className="flex flex-col gap-4">
          {firstUse ? (
            <FirstUseCard />
          ) : (
            <>
              <AllTime
                totals={totals}
                isPending={summary.isPending}
                isError={summary.isError}
                onRetry={() => summary.refetch()}
              />
              <ThisWeek stats={thisWeek} isPending={attendance.isPending} isError={attendance.isError} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Card verified ------------------------------------------------------ */

function CardVerifiedChip() {
  return (
    <Link
      to="/student/rfid"
      className="inline-flex min-h-touch items-center gap-1.5 rounded-selector bg-tint-success px-3 text-sm font-medium text-strong ring-1 ring-success/45"
    >
      <ShieldCheckIcon className="h-4 w-4" />
      Card verified
    </Link>
  );
}

/* ---- Today's Classes — the one raised area on the screen ---------------- */

type TodayProps = {
  rows: TodayEntry[];
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  hasNoEnrollment?: boolean;
  weekday: string;
  onRetry: () => void;
};

function TodaysClasses({ rows, isPending, isError, isRefetching, hasNoEnrollment, weekday, onRetry }: TodayProps) {
  return (
    <Surface level={2} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-5 md:pt-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-strong">Today</h2>
          {/* Background refetch: a note, never a return to skeletons. */}
          {isRefetching && (
            <span className="inline-flex items-center gap-1.5 text-xs text-subtle" aria-live="polite">
              <span className="loading loading-spinner loading-xs" />
              Updating
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <Link to="/student/attendance" className="text-sm font-medium text-link underline-offset-2 hover:underline">
            View attendance
          </Link>
        )}
      </div>

      <div className="mt-3" aria-live="polite">
        {isPending ? (
          <TodaySkeleton />
        ) : isError ? (
          <SectionError message="Couldn't load today's classes." onRetry={onRetry} />
        ) : hasNoEnrollment ? (
          <EmptyBlock
            icon={<BookIcon className="h-7 w-7" />}
            title="You're not enrolled in any classes yet"
            description="Your classes appear here once your institution enrolls you. Contact your administrator if you think this is wrong."
          />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon={<CalendarIcon className="h-7 w-7" />}
            title="No classes today"
            description={`Your timetable has nothing scheduled for ${weekday}.`}
            action={
              <Link to="/student/classes">
                <Button variant="ghost" size="sm">
                  View weekly schedule
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border-subtle border-t border-border-subtle">
            {rows.map((entry) => (
              <ClassRow key={entry.key} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </Surface>
  );
}

function ClassRow({ entry }: { entry: TodayEntry }) {
  return (
    <li className="flex min-h-18 items-start gap-3 px-4 py-3 md:gap-4 md:px-5 md:py-4">
      <div className="w-14 shrink-0 leading-tight md:w-16">
        <div className="text-sm font-bold text-strong">{formatTime(entry.startTime)}</div>
        <div className="text-xs text-muted">{formatTime(entry.endTime)}</div>
      </div>

      <div className="min-w-0 flex-1">
        {/* Long course names clamp; the title attribute keeps the full text. */}
        <p className="line-clamp-2 text-base font-medium text-strong" title={entry.courseName}>
          {entry.courseName}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {entry.courseCode} · {entry.section}
          {entry.room ? ` · ${entry.room}` : ""}
        </p>
        {/* Below md the state sits under the text; from md it moves right. */}
        <div className="mt-2 md:hidden">
          <RowState entry={entry} />
        </div>
      </div>

      <div className="hidden shrink-0 md:block">
        <RowState entry={entry} align="right" />
      </div>
    </li>
  );
}

function RowState({ entry, align }: { entry: TodayEntry; align?: "right" }) {
  return (
    <div className={align === "right" ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}>
      <StatusBadge status={entry.status} />
      {entry.timeIn ? (
        <span className="font-mono text-xs text-subtle">Tapped {formatTime(entry.timeIn)}</span>
      ) : entry.status === "PENDING" ? (
        <span className="text-xs text-subtle">No tap recorded yet</span>
      ) : null}
    </div>
  );
}

function TodaySkeleton() {
  return (
    <ul className="divide-y divide-border-subtle border-t border-border-subtle">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex min-h-18 items-start gap-3 px-4 py-3 md:px-5 md:py-4">
          <div className="w-14 shrink-0 space-y-1.5 md:w-16">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-20" />
        </li>
      ))}
    </ul>
  );
}

/* ---- All time ----------------------------------------------------------- */

function AllTime({
  totals,
  isPending,
  isError,
  onRetry,
}: {
  totals?: { present: number; late: number; absent: number; excused: number };
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <Surface level="sunken" className="p-4 md:p-5" >
      <h2 className="text-sm font-medium text-muted">All time · All classes</h2>

      <div className="mt-3" aria-live="polite">
        {isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : isError ? (
          <SectionError message="Couldn't load your totals." onRetry={onRetry} compact />
        ) : totals ? (
          /*
           * The four counts exactly as the API returns them. No rate, no
           * proportion bar across them, never relabelled weekly or monthly —
           * they are the most trustworthy numbers on this screen precisely
           * because they need no interpretation.
           */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-2">
            <StatTile status="PRESENT" value={totals.present} />
            <StatTile status="LATE" value={totals.late} />
            <StatTile status="ABSENT" value={totals.absent} />
            <StatTile status="EXCUSED" value={totals.excused} />
          </div>
        ) : null}
      </div>
    </Surface>
  );
}

/* ---- This week ---------------------------------------------------------- */

/*
 * Deliberately the smallest thing on the page.
 *
 * weekStats() counts a record toward the total whatever its status, but only
 * PRESENT toward the numerator — so LATE, ABSENT and EXCUSED all pull it down,
 * and a legitimately excused absence is punished. On top of that, a record is
 * created as ABSENT the moment a professor opens a session and only changes
 * when the student taps, so an in-progress class is already in the denominator
 * reading as not-Present before the student has had any chance to affect it. A
 * figure that can say 0% to someone sitting in a classroom cannot carry a
 * dashboard.
 *
 * Hence: no stat type, no card, no percentage anywhere, no gradient (which
 * would read as achievement), and the rule travels with the number. If the
 * derivation is ever changed, the figure can be promoted — and only then.
 */
function ThisWeek({
  stats,
  isPending,
  isError,
}: {
  stats: { present: number; total: number } | null;
  isPending: boolean;
  isError: boolean;
}) {
  // The week's records come from the same request as Today's rows, which
  // already shows the error and the Retry. Staying silent here avoids two
  // error messages for one failure.
  if (isError) return null;

  if (isPending) {
    return (
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!stats) return null;

  // An empty week and a genuine zero both compute to 0%. They must never look
  // alike, so the empty week gets its own sentence and no bar at all.
  const noRecords = stats.total === 0;

  return (
    <div className="px-1">
      <p className="text-sm text-strong">
        <span className="font-medium">This week: </span>
        {noRecords ? (
          "No classes recorded yet this week"
        ) : (
          <>
            {stats.present} of {stats.total} recorded {stats.total === 1 ? "class" : "classes"} marked Present.
          </>
        )}
      </p>

      {!noRecords && (
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-selector bg-surface-sunken ring-1 ring-border-subtle"
          role="img"
          aria-label={`${stats.present} of ${stats.total} recorded classes marked Present`}
        >
          {/* Flat, no number, and `link` rather than primary so the dark theme
              keeps its contrast. Never the brand gradient — that reads as a score. */}
          <div
            className="h-full rounded-selector bg-link"
            style={{ width: `${Math.round((stats.present / stats.total) * 100)}%` }}
          />
        </div>
      )}

      <p className="mt-2 text-xs text-subtle">
        Present counts classes recorded as Present. Late, Absent and Excused are not counted as Present. An opened
        class may initially appear as Absent until your attendance is recorded.
      </p>
    </div>
  );
}

/* ---- shared blocks ------------------------------------------------------ */

function FirstUseCard() {
  return (
    <Surface level="sunken" className="p-5 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-tint-primary text-primary">
        <CardIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-3 text-base font-medium text-strong">No attendance recorded yet</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
        Your totals appear here once you start tapping in. Register your RFID card to record attendance.
      </p>
      <Link to="/student/rfid" className="mt-4 inline-block">
        <Button size="sm">Go to RFID Card</Button>
      </Link>
    </Surface>
  );
}

function SectionError({ message, onRetry, compact }: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div className={compact ? "" : "px-4 pb-4 md:px-5 md:pb-5"} role="alert">
      <Banner variant="error">{message}</Banner>
      <div className="mt-3">
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-subtle">{icon}</span>
      <h3 className="text-base font-medium text-strong">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}
