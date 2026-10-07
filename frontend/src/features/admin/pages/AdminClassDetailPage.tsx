import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useForm } from "react-hook-form";
import {
  useAdminClass,
  useAdminEnrollments,
  useAdminProfessors,
  useAdminReport,
  useAdminStudents,
  useDropStudent,
  useEnrollStudent,
  useSetClassSchedule,
  useUpdateClass,
} from "../admin.queries";
import { DataState } from "@/components/ui/DataState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { classStatusSchema } from "@/lib/enums";
import { formatDays } from "@/lib/format";
import type { AdminClassDetail } from "../admin.schema";

type Tab = "details" | "schedule" | "enrollment" | "report";

export function AdminClassDetailPage() {
  const { classId = "" } = useParams();
  const [tab, setTab] = useState<Tab>("details");
  const query = useAdminClass(classId);

  return (
    <div className="flex flex-col gap-4">
      <Link to="/admin/classes" className="text-sm text-primary hover:underline">← Back to classes</Link>

      <DataState query={query}>
        {(cls) => (
          <>
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                <span className="font-mono">{cls.course.courseCode}</span> · {cls.section}
              </h1>
              <p className="text-sm text-base-content/60">
                {cls.course.courseName} · {cls.schoolYear} · {cls.semester}
                {cls.professor ? ` · ${cls.professor.name}` : ""}
              </p>
            </div>

            <div role="tablist" className="tabs tabs-box w-fit">
              <button role="tab" className={`tab ${tab === "details" ? "tab-active" : ""}`} onClick={() => setTab("details")}>Details</button>
              <button role="tab" className={`tab ${tab === "schedule" ? "tab-active" : ""}`} onClick={() => setTab("schedule")}>Schedule</button>
              <button role="tab" className={`tab ${tab === "enrollment" ? "tab-active" : ""}`} onClick={() => setTab("enrollment")}>Enrollment</button>
              <button role="tab" className={`tab ${tab === "report" ? "tab-active" : ""}`} onClick={() => setTab("report")}>Report</button>
            </div>

            {tab === "details" && <DetailsTab classId={classId} cls={cls} />}
            {tab === "schedule" && (
              <ScheduleTab key={JSON.stringify(cls.classSchedules)} classId={classId} cls={cls} />
            )}
            {tab === "enrollment" && <EnrollmentTab classId={classId} />}
            {tab === "report" && <ReportTab classId={classId} />}
          </>
        )}
      </DataState>
    </div>
  );
}

/* ---------------- Details (edit) ---------------- */
function DetailsTab({ classId, cls }: { classId: string; cls: AdminClassDetail }) {
  const update = useUpdateClass(classId);
  const professors = useAdminProfessors({ page: 1, limit: 100 });
  const form = useForm({
    defaultValues: {
      professorId: cls.professor?.id ?? "",
      section: cls.section,
      room: cls.room ?? "",
      status: cls.status,
    },
  });
  useEffect(() => {
    form.reset({ professorId: cls.professor?.id ?? "", section: cls.section, room: cls.room ?? "", status: cls.status });
  }, [cls]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = form.handleSubmit((v) =>
    update.mutate({
      ...(v.professorId ? { professorId: v.professorId } : {}),
      section: v.section,
      room: v.room || undefined,
      status: v.status,
    }),
  );

  return (
    <form onSubmit={save} className="max-w-lg rounded-box border border-base-300 bg-base-100 p-5">
      <div className="flex flex-col gap-3">
        <label className="form-control">
          <span className="label-text mb-1">Professor</span>
          <select className="select select-bordered" {...form.register("professorId")}>
            {professors.data?.items.map((p) => <option key={p.user.id} value={p.user.id}>{p.user.name} ({p.employeeNumber})</option>)}
          </select>
        </label>
        <TextField id="cl-section" label="Section" {...form.register("section")} />
        <TextField id="cl-room" label="Room" {...form.register("room")} />
        <label className="form-control">
          <span className="label-text mb-1">Status</span>
          <select className="select select-bordered" {...form.register("status")}>
            {classStatusSchema.options.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <div><Button type="submit" loading={update.isPending}>Save</Button></div>
      </div>
    </form>
  );
}

/* ---------------- Schedule editor ----------------
 * Schedules are @db.Time — ISO strings whose UTC wall-clock is the real value.
 * <input type="time"> works in "HH:MM"; we convert on load (UTC) and pad to
 * "HH:MM:SS" the API expects on save. The endpoint replaces the whole set.
 */
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function isoToTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

type ScheduleRow = { dayOfWeek: number[]; startTime: string; endTime: string };

function ScheduleTab({ classId, cls }: { classId: string; cls: AdminClassDetail }) {
  const setSchedule = useSetClassSchedule(classId);
  const [rows, setRows] = useState<ScheduleRow[]>(() =>
    cls.classSchedules.map((s) => ({
      dayOfWeek: [...s.dayOfWeek].sort((a, b) => a - b),
      startTime: isoToTimeInput(s.startTime),
      endTime: isoToTimeInput(s.endTime),
    })),
  );

  const update = (i: number, patch: Partial<ScheduleRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const toggleDay = (i: number, day: number) =>
    update(i, {
      dayOfWeek: rows[i]!.dayOfWeek.includes(day)
        ? rows[i]!.dayOfWeek.filter((d) => d !== day)
        : [...rows[i]!.dayOfWeek, day].sort((a, b) => a - b),
    });
  const addRow = () => setRows((rs) => [...rs, { dayOfWeek: [], startTime: "08:00", endTime: "09:00" }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const valid = rows.length > 0 && rows.every((r) => r.dayOfWeek.length > 0 && r.startTime < r.endTime);
  const save = () =>
    setSchedule.mutate(
      rows.map((r) => ({ dayOfWeek: r.dayOfWeek, startTime: `${r.startTime}:00`, endTime: `${r.endTime}:00` })),
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {rows.length === 0 && <p className="text-sm text-base-content/50">No schedule slots. Add one below.</p>}
        {rows.map((row, i) => (
          <div key={i} className="rounded-box border border-base-300 bg-base-100 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <span className="label-text mb-1 block">Days</span>
                <div className="flex gap-1">
                  {DAY_LABELS.map((label, day) => (
                    <button
                      key={day}
                      type="button"
                      className={`btn btn-xs ${row.dayOfWeek.includes(day) ? "btn-primary" : "btn-ghost border border-base-300"}`}
                      onClick={() => toggleDay(i, day)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="form-control">
                <span className="label-text mb-1">Start</span>
                <input type="time" className="input input-bordered input-sm" value={row.startTime} onChange={(e) => update(i, { startTime: e.target.value })} />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">End</span>
                <input type="time" className="input input-bordered input-sm" value={row.endTime} onChange={(e) => update(i, { endTime: e.target.value })} />
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(i)}>Remove</Button>
            </div>
            {row.dayOfWeek.length > 0 && row.startTime >= row.endTime && (
              <p className="mt-2 text-xs text-error">Start must be before end.</p>
            )}
            {row.dayOfWeek.length > 0 && <p className="mt-2 text-xs text-base-content/50">{formatDays(row.dayOfWeek)}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={addRow}>Add slot</Button>
        <Button type="button" onClick={save} loading={setSchedule.isPending} disabled={!valid}>Save schedule</Button>
        {!valid && rows.length > 0 && <span className="text-xs text-warning">Each slot needs a day and a valid time range.</span>}
      </div>
    </div>
  );
}

/* ---------------- Enrollment ---------------- */
function EnrollmentTab({ classId }: { classId: string }) {
  const query = useAdminEnrollments(classId);
  const enroll = useEnrollStudent(classId);
  const drop = useDropStudent(classId);
  const students = useAdminStudents({ page: 1, limit: 100 });
  const [pick, setPick] = useState("");

  // Hide already-enrolled students from the picker.
  const enrolledIds = useMemo(
    () => new Set((query.data ?? []).filter((e) => e.status === "ENROLLED").map((e) => e.student.id)),
    [query.data],
  );
  const options = (students.data?.items ?? []).filter((s) => !enrolledIds.has(s.user.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <label className="form-control grow">
          <span className="label-text mb-1">Enroll a student</span>
          <select className="select select-bordered" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Select a student…</option>
            {options.map((s) => <option key={s.user.id} value={s.user.id}>{s.user.name} — {s.studentNumber}</option>)}
          </select>
        </label>
        <Button disabled={!pick} loading={enroll.isPending} onClick={() => enroll.mutate(pick, { onSuccess: () => setPick("") })}>Enroll</Button>
      </div>

      <DataState query={query} isEmpty={query.data?.length === 0} empty={<EmptyState title="No students enrolled" />}>
        {(rows) => (
          <div className="overflow-x-auto rounded-box border border-base-300">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.student.id} className="hover">
                    <td className="font-medium">{e.student.name}</td>
                    <td className="text-sm text-base-content/70">{e.student.email}</td>
                    <td><Badge>{e.status}</Badge></td>
                    <td className="text-right">
                      {e.status === "ENROLLED" && (
                        <Button size="sm" variant="error" loading={drop.isPending} onClick={() => drop.mutate(e.student.id)}>Drop</Button>
                      )}
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

/* ---------------- Report ---------------- */
function ReportTab({ classId }: { classId: string }) {
  const query = useAdminReport(classId);
  return (
    <DataState query={query}>
      {(report) => (
        <div className="overflow-x-auto rounded-box border border-base-300">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Present</th><th>Late</th><th>Absent</th><th>Excused</th><th>Total</th></tr>
            </thead>
            <tbody>
              {report.students.map((s) => (
                <tr key={s.studentId}>
                  <td>
                    <div className="font-medium">{s.studentName}</div>
                    <div className="text-xs text-base-content/60">{s.studentNumber}</div>
                  </td>
                  <td className="text-success">{s.present}</td>
                  <td className="text-warning">{s.late}</td>
                  <td className="text-error">{s.absent}</td>
                  <td className="text-info">{s.excused}</td>
                  <td>{s.totalSessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DataState>
  );
}
